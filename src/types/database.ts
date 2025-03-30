
export interface GlobalVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'variable' | 'constant';
  value: any;
  description?: string;
  isSystemVariable?: boolean;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  createdAt?: Date;
  updatedAt?: Date;
}
