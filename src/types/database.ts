import { Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  position: string;
  fields: {
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GlobalVariable {
  id: string;
  name: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'object' | 'variable' | 'constant';
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
