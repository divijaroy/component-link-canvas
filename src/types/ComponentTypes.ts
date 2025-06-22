export interface Label {
  label: string;
  value: string;
}

export interface Component {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  owner?: string;
  description?: string;
  tags?: string[];
  components: (Component | string)[]; // Nested components or empty strings
  labels: Label[];
  app_ui_link?: string;
  metrics_ui_link?: string;
  connections: (string | ConnectionObject)[]; // Connections defined at component level - can be string (old format) or ConnectionObject (new format)
}

export interface ConnectionObject {
  id: string;
  target: string;
  name: string;
  type: string;
  description?: string;
  labels: Label[];
  app_ui_link?: string;
  metrics_ui_link?: string;
  status?: string;
  latency?: string;
}

export interface SystemData {
  components: Component[];
  connections?: any[]; // Connection components like Kafka, Redis, etc.
}

export interface Position {
  x: number;
  y: number;
}

export interface ComponentNode {
  id: string;
  name: string;
  labels: Label[];
  position: Position;
  width: number;
  height: number;
  type: 'component' | 'subcomponent';
  parentId?: string;
  level: number;
  app_ui_link?: string;
  metrics_ui_link?: string;
  connections: string[];
  nodeType: 'parent' | 'leaf';
}

export interface ConnectionLine {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'stream' | 'api';
  path?: Position[];
}

export interface ComponentGroup {
  id: string;
  name: string;
  mainComponent: ComponentNode;
  subComponents: ComponentNode[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  label?: string;
  connectionComponentId?: string; // ID of the connection component (Kafka, Redis, etc.)
}

export interface Layout {
  nodes: any[];
  edges: any[];
  width?: number;
  height?: number;
}
