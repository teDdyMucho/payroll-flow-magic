
export interface GlobalVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'variable' | 'constant';
  value: any;
  description?: string;
  isSystemVariable?: boolean;
}
