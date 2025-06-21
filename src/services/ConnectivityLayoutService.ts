import { SystemData, Position, Component } from '../types/ComponentTypes';

export interface ConnectivityNode {
  id: string;
  component: Component;
  position: Position;
  inDegree: number;
  outDegree: number;
  totalConnections: number;
  level: number; // Distance from center (0 = center, higher = further out)
}

export interface ConnectivityLayout {
  nodes: ConnectivityNode[];
  center: Position;
  radius: number;
}

export class ConnectivityLayoutService {
  private data: SystemData;
  private nodes: Map<string, ConnectivityNode> = new Map();
  private connections: Map<string, Set<string>> = new Map();

  constructor(data: SystemData) {
    this.data = data;
    this.buildConnectivityGraph();
  }

  /**
   * Build the connectivity graph from system data
   * Only create nodes for main components, treat sub-components as part of their parents
   */
  private buildConnectivityGraph() {
    console.log('Building connectivity graph with data:', this.data);
    
    // Create nodes only for main components
    this.data.components.forEach(component => {
      console.log(`Creating main component node: ${component.id}`);
      
      this.nodes.set(component.id, {
        id: component.id,
        component,
        position: { x: 0, y: 0 },
        inDegree: 0,
        outDegree: 0,
        totalConnections: 0,
        level: 0
      });
    });

    console.log('Created main component nodes:', Array.from(this.nodes.keys()));

    // Build connection matrix and calculate degrees
    this.data.connections.forEach(connection => {
      const sourceId = connection.start.replace(/"/g, '');
      const targetId = connection.end.replace(/"/g, '');
      
      console.log(`Processing connection: ${sourceId} -> ${targetId}`);
      
      // Map sub-component connections to their parent components
      const sourceParent = this.findParentComponent(sourceId);
      const targetParent = this.findParentComponent(targetId);
      
      if (sourceParent && targetParent) {
        console.log(`Mapped connection: ${sourceParent} -> ${targetParent}`);
        
        if (!this.connections.has(sourceParent)) {
          this.connections.set(sourceParent, new Set());
        }
        if (!this.connections.has(targetParent)) {
          this.connections.set(targetParent, new Set());
        }
        
        this.connections.get(sourceParent)!.add(targetParent);
        this.connections.get(targetParent)!.add(sourceParent);
      }
    });

    console.log('Connection matrix:', Object.fromEntries(
      Array.from(this.connections.entries()).map(([key, value]) => [key, Array.from(value)])
    ));

    // Calculate degrees for each node
    this.nodes.forEach(node => {
      const connections = this.connections.get(node.id) || new Set();
      node.totalConnections = connections.size;
      
      // Calculate in/out degrees based on mapped connections
      this.data.connections.forEach(connection => {
        const sourceId = connection.start.replace(/"/g, '');
        const targetId = connection.end.replace(/"/g, '');
        
        const sourceParent = this.findParentComponent(sourceId);
        const targetParent = this.findParentComponent(targetId);
        
        if (node.id === targetParent) {
          node.inDegree++;
        }
        if (node.id === sourceParent) {
          node.outDegree++;
        }
      });
    });
  }

  /**
   * Find the parent component for a sub-component ID
   */
  private findParentComponent(componentId: string): string | null {
    // First check if it's a main component
    if (this.nodes.has(componentId)) {
      return componentId;
    }
    
    // Then check if it's a sub-component
    for (const component of this.data.components) {
      if (component.sub_components.some(sub => sub.id === componentId)) {
        return component.id;
      }
    }
    
    return null;
  }

  /**
   * Calculate layout based on connectivity
   */
  calculateLayout(containerWidth: number, containerHeight: number): ConnectivityLayout {
    const nodes = Array.from(this.nodes.values());
    const center = { x: containerWidth / 2, y: containerHeight / 2 };
    const maxRadius = Math.min(containerWidth, containerHeight) * 0.35;
    
    // Sort nodes by total connections (most connected first)
    nodes.sort((a, b) => b.totalConnections - a.totalConnections);
    
    // Assign levels based on connectivity
    this.assignLevels(nodes);
    
    // Position nodes in concentric circles based on levels
    this.positionNodesInCircles(nodes, center, maxRadius);
    
    return {
      nodes,
      center,
      radius: maxRadius
    };
  }

  /**
   * Assign levels based on connectivity (0 = center, higher = further out)
   */
  private assignLevels(nodes: ConnectivityNode[]) {
    const maxConnections = Math.max(...nodes.map(n => n.totalConnections));
    const minConnections = Math.min(...nodes.map(n => n.totalConnections));
    
    nodes.forEach(node => {
      if (node.totalConnections === 0) {
        node.level = 3; // Disconnected nodes go to the outside
      } else {
        // Calculate level based on connectivity (0 = most connected, 3 = least connected)
        const connectivityRatio = (maxConnections - node.totalConnections) / (maxConnections - minConnections);
        node.level = Math.floor(connectivityRatio * 3);
      }
    });
  }

  /**
   * Position nodes in concentric circles
   */
  private positionNodesInCircles(nodes: ConnectivityNode[], center: Position, maxRadius: number) {
    // Group nodes by level
    const nodesByLevel = new Map<number, ConnectivityNode[]>();
    nodes.forEach(node => {
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)!.push(node);
    });
    
    // Position each level in a circle
    const maxLevel = Math.max(...nodesByLevel.keys());
    
    nodesByLevel.forEach((levelNodes, level) => {
      const radius = (level / maxLevel) * maxRadius;
      const angleStep = (2 * Math.PI) / levelNodes.length;
      
      levelNodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.position = {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius
        };
      });
    });
  }

  /**
   * Get node by ID
   */
  getNode(id: string): ConnectivityNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): ConnectivityNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get connections for a node
   */
  getConnections(nodeId: string): string[] {
    return Array.from(this.connections.get(nodeId) || []);
  }
} 