import { Timestamp } from 'firebase/firestore';

export interface GlobalVariable {
  id: string;
  name: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'object' | 'variable' | 'constant';
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Initial set of global variables and constants
export const initialGlobalVariables: GlobalVariable[] = [
  {
    id: 'global-1',
    name: 'TAX_MULTIPLIER',
    value: 1.0,
    type: 'number',
    description: 'Standard tax multiplier for all calculations'
  },
  {
    id: 'global-2',
    name: 'BENEFITS_RATE',
    value: 0.1,
    type: 'number',
    description: 'Standard benefits rate as percentage of salary'
  },
  {
    id: 'global-3',
    name: 'currentMonth',
    value: 'May',
    type: 'string',
    description: 'Current payroll month'
  }
];
