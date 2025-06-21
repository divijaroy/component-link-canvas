export interface Label {
  label: string;
  value: string;
}

export interface Component {
  id: string;
  name: string;
  components: (Component | string)[]; // Nested components or empty strings
  labels: Label[];
  app_ui_link?: string;
  metrics_ui_link?: string;
  connections: string[]; // Connections defined at component level
}

export interface SystemData {
  components: Component[];
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
