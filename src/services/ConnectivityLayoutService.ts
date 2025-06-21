import { SystemData, Component, ComponentNode, Position, ConnectionLine } from '../types/ComponentTypes';

export class ConnectivityLayoutService {
  private static readonly CANVAS_WIDTH = 2000;
  private static readonly CANVAS_HEIGHT = 1200;
  private static readonly COMPONENT_SPACING = 300;
  private static readonly SUBCOMPONENT_OFFSET = 200;

  /**
   * Convert system data to nodes and connections
   */
  static processSystemData(data: SystemData): {
    nodes: ComponentNode[];
    connections: ConnectionLine[];
  } {
    const nodes: ComponentNode[] = [];
    const connections: ConnectionLine[] = [];
    const connectionIdCounter = { value: 0 };

    // Process main components and their sub-components
    data.components.forEach((component) => {
      // Add main component
      const mainNode: ComponentNode = {
        id: component.id,
        name: component.name,
        labels: component.labels,
        position: { x: 0, y: 0 }, // Will be calculated later
        type: 'component',
        app_ui_link: component.app_ui_link,
        metrics_ui_link: component.metrics_ui_link,
        connections: component.connections
      };
      nodes.push(mainNode);

      // Add connections from the main component
      component.connections.forEach((targetId) => {
        connections.push({
          id: `conn-${connectionIdCounter.value++}`,
          source: component.id,
          target: targetId,
          label: `Data Flow`,
          type: 'stream'
        });
      });

      // Process sub-components
      component.components.forEach((subComponent) => {
        if (typeof subComponent === 'string' && subComponent.trim() === '') {
          return; // Skip empty strings
        }
        
        if (typeof subComponent === 'object') {
          const subNode: ComponentNode = {
            id: subComponent.id,
            name: subComponent.name,
            labels: subComponent.labels,
            position: { x: 0, y: 0 }, // Will be calculated later
            type: 'subcomponent',
            parentId: component.id,
            app_ui_link: subComponent.app_ui_link,
            metrics_ui_link: subComponent.metrics_ui_link,
            connections: subComponent.connections
          };
          nodes.push(subNode);

          // Add connections from sub-component
          subComponent.connections.forEach((targetId) => {
            connections.push({
              id: `conn-${connectionIdCounter.value++}`,
              source: subComponent.id,
              target: targetId,
              label: `Data Flow`,
              type: 'stream'
            });
          });
        }
      });
    });

    console.log('Processed nodes:', nodes);
    console.log('Processed connections:', connections);

    return { nodes, connections };
  }

  /**
   * Calculate positions based on connectivity
   */
  static calculatePositions(nodes: ComponentNode[], connections: ConnectionLine[]): ComponentNode[] {
    const positionedNodes = [...nodes];
    
    // Separate main components and sub-components
    const mainComponents = positionedNodes.filter(node => node.type === 'component');
    const subComponents = positionedNodes.filter(node => node.type === 'subcomponent');
    
    console.log('Main components:', mainComponents.length);
    console.log('Sub components:', subComponents.length);

    // Calculate connectivity scores for main components
    const connectivityScores = this.calculateConnectivityScores(mainComponents, connections);
    console.log('Connectivity scores:', connectivityScores);

    // Sort main components by connectivity (most connected first)
    const sortedMainComponents = mainComponents.sort((a, b) => {
      const scoreA = connectivityScores.get(a.id) || 0;
      const scoreB = connectivityScores.get(b.id) || 0;
      return scoreB - scoreA;
    });

    // Position main components in concentric circles
    this.positionMainComponents(sortedMainComponents);

    // Position sub-components around their parents
    this.positionSubComponents(subComponents, sortedMainComponents);

    console.log('Final positioned nodes:', positionedNodes);
    return positionedNodes;
  }

  /**
   * Calculate connectivity scores for components
   */
  private static calculateConnectivityScores(
    components: ComponentNode[], 
    connections: ConnectionLine[]
  ): Map<string, number> {
    const scores = new Map<string, number>();
    
    components.forEach(component => {
      let score = 0;
      
      // Count outgoing connections
      score += connections.filter(conn => conn.source === component.id).length;
      
      // Count incoming connections
      score += connections.filter(conn => conn.target === component.id).length;
      
      // Add bonus for being a hub (many connections)
      if (score > 2) {
        score += 2;
      }
      
      scores.set(component.id, score);
    });
    
    return scores;
  }

  /**
   * Position main components in concentric circles
   */
  private static positionMainComponents(components: ComponentNode[]): void {
    if (components.length === 0) return;

    const centerX = this.CANVAS_WIDTH / 2;
    const centerY = this.CANVAS_HEIGHT / 2;

    if (components.length === 1) {
      components[0].position = { x: centerX, y: centerY };
      return;
    }

    // Position components in concentric circles
    const radius = Math.min(this.CANVAS_WIDTH, this.CANVAS_HEIGHT) / 4;
    const angleStep = (2 * Math.PI) / components.length;

    components.forEach((component, index) => {
      const angle = index * angleStep;
      component.position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }

  /**
   * Position sub-components around their parents
   */
  private static positionSubComponents(
    subComponents: ComponentNode[], 
    mainComponents: ComponentNode[]
  ): void {
    const parentPositions = new Map<string, Position>();
    mainComponents.forEach(comp => {
      parentPositions.set(comp.id, comp.position);
    });

    subComponents.forEach((subComponent, index) => {
      const parentId = subComponent.parentId;
      if (!parentId || !parentPositions.has(parentId)) {
        // Fallback position if parent not found
        subComponent.position = { x: 100 + index * 200, y: 100 };
        return;
      }

      const parentPos = parentPositions.get(parentId)!;
      const angle = (index * (2 * Math.PI)) / 4; // Distribute around parent
      
      subComponent.position = {
        x: parentPos.x + this.SUBCOMPONENT_OFFSET * Math.cos(angle),
        y: parentPos.y + this.SUBCOMPONENT_OFFSET * Math.sin(angle)
      };
    });
  }

  /**
   * Get bounding box for a component
   */
  static getComponentBoundingBox(node: ComponentNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const isMain = node.type === 'component';
    const width = isMain ? 320 : 288; // Card widths
    const height = isMain ? 160 : 140; // Card heights
    
    return {
      x: node.position.x - width / 2,
      y: node.position.y - height / 2,
      width,
      height
    };
  }

  /**
   * Get all component bounding boxes for collision detection
   */
  static getAllBoundingBoxes(nodes: ComponentNode[]): Map<string, {
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const boundingBoxes = new Map();
    
    nodes.forEach(node => {
      boundingBoxes.set(node.id, this.getComponentBoundingBox(node));
    });
    
    return boundingBoxes;
  }
} 