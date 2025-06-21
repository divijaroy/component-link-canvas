import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { Component, Connection, Layout } from '../types/ComponentTypes';

const elk = new ELK();

const DEFAULT_WIDTH = 300;
const PARENT_PADDING_TOP = 50; // Extra space for the parent title
const PARENT_PADDING_SIDES = 20;

// Constants for flexible height calculation (approximating MaterialComponentCard layout)
const CARD_HEADER_HEIGHT = 32;
const CAPSULE_HEIGHT = 24; // Approximated height of a label capsule
const CAPSULES_PER_ROW = 3; // How many capsules fit horizontally before wrapping
const CAPSULE_V_SPACING = 4; // gap-1 from tailwind
const CARD_CONTENT_PADDING_Y = 8; // py-2 for card content

// Simple hash function to create a unique key for the data
const createDataHash = (components: Component[], connections: Connection[]): string => {
  const dataString = JSON.stringify({
    components: components.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })),
    connections: connections.map(c => ({ source: c.source, target: c.target }))
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Cache key for localStorage
const CACHE_KEY = 'component-layout-cache';

// Function to clear the layout cache
export const clearLayoutCache = (): void => {
  try {
    // Clear all layout cache entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Layout cache cleared successfully');
  } catch (error) {
    console.warn('Failed to clear layout cache:', error);
  }
};

const calculateLeafNodeHeight = (component: Component): number => {
  const labelCount = Math.min(component.labels?.length || 0, 5); // Capped at 5 displayed labels
  if (labelCount === 0) {
    return CARD_HEADER_HEIGHT + CARD_CONTENT_PADDING_Y * 2; // Base height with padding
  }

  const rows = Math.ceil(labelCount / CAPSULES_PER_ROW);
  let height = CARD_HEADER_HEIGHT;
  height += rows * CAPSULE_HEIGHT;
  if (rows > 1) {
    height += (rows - 1) * CAPSULE_V_SPACING;
  }
  height += CARD_CONTENT_PADDING_Y * 2; // Vertical padding for content area

  // Add extra space for the "+X more" label if needed
  if ((component.labels?.length || 0) > 5) {
      height += CAPSULE_HEIGHT + CAPSULE_V_SPACING;
  }

  return Math.max(height, 80); // Ensure a minimum height
};

export const generateLayout = async (
  components: Component[],
  connections: Connection[],
  showConnections: boolean
): Promise<Layout> => {
  // Create a hash of the input data
  const dataHash = createDataHash(components, connections);
  const cacheKey = `${CACHE_KEY}-${dataHash}`;
  
  // Try to get cached layout
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Verify the cache is still valid (has all required properties)
      if (parsedCache.nodes && parsedCache.edges && parsedCache.width !== undefined) {
        console.log('Using cached layout');
        return parsedCache;
      }
    }
  } catch (error) {
    console.warn('Failed to load cached layout:', error);
  }

  // If no cache or invalid cache, calculate new layout
  console.log('Calculating new layout');
  
  const elkNodesMap = new Map<string, ElkNode>();
  const rootChildren: ElkNode[] = [];

  // Create all node objects and store them in a map
  for (const component of components) {
    const isParent = components.some((c) => c.parentId === component.id);

    const elkNode: ElkNode = {
      id: component.id,
      width: DEFAULT_WIDTH,
      children: [],
      layoutOptions: {},
    };

    if (isParent) {
      // For parents, we don't set a height. We let ELK determine it.
      // We set padding to ensure children are not on top of the title.
      elkNode.layoutOptions = {
        'elk.padding': `[top=${PARENT_PADDING_TOP},left=${PARENT_PADDING_SIDES},bottom=${PARENT_PADDING_SIDES},right=${PARENT_PADDING_SIDES}]`,
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN', // Critical for auto-sizing
      };
    } else {
      // For leaf nodes, we calculate the height based on content.
      elkNode.height = calculateLeafNodeHeight(component);
    }
    
    elkNodesMap.set(component.id, elkNode);
  }

  // A map to easily access original component data
  const componentsMap = new Map<string, Component>(components.map(c => [c.id, c]));

  // Build the hierarchy
  for (const component of components) {
    const elkNode = elkNodesMap.get(component.id);
    if (!elkNode) continue;

    if (component.parentId && elkNodesMap.has(component.parentId)) {
      const parentElkNode = elkNodesMap.get(component.parentId);
      parentElkNode?.children?.push(elkNode);
    } else {
      rootChildren.push(elkNode);
    }
  }

  const elkEdges: ElkExtendedEdge[] = showConnections
    ? connections.map((connection) => ({
        id: connection.id,
        sources: [connection.source],
        targets: [connection.target],
      }))
    : [];

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '150',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    },
    children: rootChildren,
    edges: elkEdges,
  };

  try {
    const layout = await elk.layout(graph);
    
    const flattenNodes = (nodes: ElkNode[], parentX = 0, parentY = 0): ElkNode[] => {
      let flat: ElkNode[] = [];
      for (const node of nodes) {
        // Adjust position to be absolute
        node.x = (node.x ?? 0) + parentX;
        node.y = (node.y ?? 0) + parentY;
        
        const children = node.children;
        // The node itself is pushed onto the flat list
        flat.push({ ...node, children: undefined }); 

        if (children && children.length > 0) {
          // Recurse for children, passing the parent's absolute position
          flat = flat.concat(flattenNodes(children, node.x, node.y));
        }
      }
      return flat;
    };
    
    const finalNodes = flattenNodes(layout.children || []);

    const finalEdges = (layout.edges || []).map(edge => {
      const originalEdge = connections.find(c => c.id === edge.id);
      
      // If ELK didn't provide sections, create a simple orthogonal path
      let path = null;
      if (edge.sections && edge.sections.length > 0) {
        path = edge.sections[0];
      } else {
        // Find source and target nodes to create an orthogonal path
        const sourceNode = finalNodes.find(n => n.id === edge.sources[0]);
        const targetNode = finalNodes.find(n => n.id === edge.targets[0]);
        if (sourceNode && targetNode) {
          const sourceX = sourceNode.x + (sourceNode.width || 0) / 2;
          const sourceY = sourceNode.y + (sourceNode.height || 0) / 2;
          const targetX = targetNode.x + (targetNode.width || 0) / 2;
          const targetY = targetNode.y + (targetNode.height || 0) / 2;
          
          // Simple orthogonal path with one bend point
          const midX = sourceX;
          const midY = targetY;
          
          path = {
            startPoint: { x: sourceX, y: sourceY },
            endPoint: { x: targetX, y: targetY },
            bendPoints: [
              { x: midX, y: midY }
            ]
          };
        }
      }
      
      return {
        ...edge,
        id: edge.id,
        source: edge.sources[0],
        target: edge.targets[0],
        label: originalEdge?.label,
        sections: path ? [path] : undefined,
      };
    });

    const enrichedNodes = finalNodes.map(node => {
      const originalComponent = componentsMap.get(node.id);
      if (!originalComponent) {
        return {
          ...node,
          id: node.id,
          isParent: (node.children?.length ?? 0) > 0,
        };
      }
      const isParent = components.some(c => c.parentId === originalComponent.id);
      return {
        ...originalComponent,
        ...node,
        isParent: isParent,
      };
    });

    const result = {
      nodes: enrichedNodes,
      edges: finalEdges,
      width: layout.width,
      height: layout.height,
    };

    // Cache the result
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
      console.log('Layout cached successfully');
    } catch (error) {
      console.warn('Failed to cache layout:', error);
    }

    return result;
  } catch (e) {
    console.error('Error during layout calculation:', e);
    throw e;
  }
}; 