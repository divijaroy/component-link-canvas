
export interface Label {
  label: string;
  evaluator: string;
  value?: any; // Dynamic value from evaluation
}

export interface SubComponent {
  id: string;
  name: string;
  labels: Label[];
  app_ui_link?: string;
  cosmos_link?: string;
}

export interface Component {
  id: string;
  name: string;
  sub_components: SubComponent[];
  labels: Label[];
  app_ui_link?: string;
  cosmos_link?: string;
}

export interface Connection {
  start: string;
  end: string;
  label?: string; // New field for connection labels
  type?: string; // New field for connection type (e.g., "kafka", "http", etc.)
}

export interface SystemData {
  components: Component[];
  connections: Connection[];
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
  type: 'component' | 'subcomponent';
  parentId?: string;
  app_ui_link?: string;
  cosmos_link?: string;
}

export interface ConnectionLine {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}
