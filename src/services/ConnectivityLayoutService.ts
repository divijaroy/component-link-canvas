import ELK from 'elkjs/lib/elk.bundled.js';
import { SystemData, Component, ComponentNode, Position, ConnectionLine } from '../types/ComponentTypes';

const PADDING = 20;
const CARD_HEADER_HEIGHT = 50;
const CARD_LABEL_HEIGHT = 20;

const elk = new ELK();

export class ConnectivityLayoutService {

  static async processAndLayout(data: SystemData): Promise<{ nodes: ComponentNode[], connections: ConnectionLine[] }> {
    const connectionIdCounter = { value: 0 };
    
    const { nodes, connections: originalConnections } = this.createFlatNodeList(data, connectionIdCounter);
    this.calculateNodeSizes(nodes);
    const elkGraph = this.buildElkHierarchy(nodes, originalConnections);
    const layout = await elk.layout(elkGraph);
    
    const laidOutNodes: ComponentNode[] = [];
    this.applyElkLayout(layout, nodes, laidOutNodes);

    // After nodes are positioned, extract the edge routes from the layout
    const routedConnections = this.extractEdgeRoutes(layout, originalConnections);

    return { nodes: laidOutNodes, connections: routedConnections };
  }

  private static createFlatNodeList(data: SystemData, connectionIdCounter: { value: number }) {
    const nodes: ComponentNode[] = [];
    const connections: ConnectionLine[] = [];
    
    function traverse(components: (Component | string)[], parentId?: string, level: number = 0) {
      components.forEach(comp => {
        if (typeof comp === 'string' || !comp.id) return;
        
        // Create a node for every component, regardless of whether it has connections
        const node: ComponentNode = {
          id: comp.id, name: comp.name, labels: comp.labels,
          connections: comp.connections, parentId, level,
          type: level === 0 ? 'component' : 'subcomponent',
          app_ui_link: comp.app_ui_link, metrics_ui_link: comp.metrics_ui_link,
          position: { x: 0, y: 0 }, width: 320, height: 100, // Default sizes
        };
        nodes.push(node);
        
        // Only create connections if the component has connections defined
        if (comp.connections && comp.connections.length > 0) {
          comp.connections.forEach(targetId => {
            connections.push({
              id: `conn-${connectionIdCounter.value++}`, source: comp.id, target: targetId,
              label: `Data Flow`, type: 'stream'
            });
          });
        }

        // Recursively process nested components
        if (comp.components && comp.components.length > 0) {
          traverse(comp.components, comp.id, level + 1);
        }
      });
    }
    traverse(data.components);
    return { nodes, connections };
  }

  private static calculateNodeSizes(nodes: ComponentNode[]) {
    // Calculate dynamic heights based on the number of labels
    for (const node of nodes) {
      node.width = 320;
      
      // Calculate height based on number of labels (capped at 5)
      const labelCount = Math.min(node.labels.length, 5);
      
      // Base height: header (32px) + content padding (12px) + capsule layout
      let baseHeight = 44; // 32px header + 12px padding
      
      if (labelCount > 0) {
        // Capsule design: each row can fit ~2-3 capsules depending on width
        // Each capsule is ~24px tall, with 6px gap
        const capsulesPerRow = 2; // Conservative estimate
        const rows = Math.ceil(labelCount / capsulesPerRow);
        const capsuleHeight = 24; // height of each capsule
        const rowGap = 6;
        
        const labelHeight = rows * capsuleHeight + (rows - 1) * rowGap;
        baseHeight += labelHeight;
        
        // Add extra space for "more" indicator if there are more than 5 labels
        if (node.labels.length > 5) {
          baseHeight += 24; // Space for "+X more" capsule
        }
      }
      
      // Ensure minimum height for all components
      node.height = Math.max(baseHeight, 80);
    }
  }

  private static buildElkHierarchy(nodes: ComponentNode[], connections: ConnectionLine[]) {
    const elkNodeMap = new Map();
    nodes.forEach(n => {
        elkNodeMap.set(n.id, {
            id: n.id, width: n.width, height: n.height, children: [],
            layoutOptions: { 'elk.padding.top': '60', 'elk.padding.left': '20', 'elk.padding.bottom': '20', 'elk.padding.right': '20' }
        });
    });

    const rootElkNodes: any[] = [];
    nodes.forEach(n => {
        if (n.parentId && elkNodeMap.has(n.parentId)) {
            elkNodeMap.get(n.parentId).children.push(elkNodeMap.get(n.id));
        } else {
            rootElkNodes.push(elkNodeMap.get(n.id));
        }
    });

    return {
      id: 'root',
      layoutOptions: { 
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '80',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.edgeRouting': 'ORTHOGONAL',
      },
      children: rootElkNodes,
      edges: connections.map(c => ({ id: c.id, sources: [c.source], targets: [c.target] })),
    };
  }

  private static applyElkLayout(layout: any, originalNodes: ComponentNode[], laidOutNodes: ComponentNode[]) {
    if (!layout.children) return;

    function applyRecursively(elkChildren: any[], parentX = 0, parentY = 0) {
      for (const elkNode of elkChildren) {
        const absoluteX = (elkNode.x || 0) + parentX;
        const absoluteY = (elkNode.y || 0) + parentY;

        const originalNode = originalNodes.find(n => n.id === elkNode.id);
        if (originalNode) {
          const newNode: ComponentNode = {
            ...originalNode,
            position: {
              x: absoluteX + elkNode.width / 2,
              y: absoluteY + elkNode.height / 2,
            },
            width: elkNode.width,
            height: elkNode.height,
          };
          laidOutNodes.push(newNode);
        }

        if (elkNode.children) {
          applyRecursively(elkNode.children, absoluteX, absoluteY);
        }
      }
    }

    applyRecursively(layout.children);
  }

  private static extractEdgeRoutes(layout: any, originalConnections: ConnectionLine[]): ConnectionLine[] {
    const newConnections: ConnectionLine[] = [];
    if (!layout.edges) return originalConnections;

    layout.edges.forEach((elkEdge: any) => {
      const original = originalConnections.find(c => c.id === elkEdge.id);
      if (original) {
        const points: Position[] = [];
        (elkEdge.sections || []).forEach((section: any) => {
          points.push({ x: section.startPoint.x, y: section.startPoint.y });
          (section.bendPoints || []).forEach((bp: any) => {
            points.push({ x: bp.x, y: bp.y });
          });
          points.push({ x: section.endPoint.x, y: section.endPoint.y });
        });
        
        // Add the routed path to the connection object
        newConnections.push({ ...original, path: points });
      }
    });

    return newConnections;
  }

  static getComponentBoundingBox(node: ComponentNode): { x: number; y: number; width: number; height: number; } {
    return {
      x: node.position.x - node.width / 2,
      y: node.position.y - node.height / 2,
      width: node.width,
      height: node.height,
    };
  }
} 