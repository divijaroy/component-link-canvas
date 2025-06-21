
export interface SubComponent {
  id: string;
  name: string;
  tags: string[];
  description?: string;
  connections?: string[];
}

export interface ComponentData {
  id: string;
  name: string;
  tags: string[];
  description?: string;
  subComponents: SubComponent[];
  connections?: string[];
}

export interface Position {
  x: number;
  y: number;
}

export interface ComponentNode {
  id: string;
  name: string;
  tags: string[];
  position: Position;
  type: 'component' | 'subcomponent';
  parentId?: string;
  description?: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}
