
export interface GlobalVariable {
  id: string;
  name: string;
  value: number | string;
  type: 'constant' | 'variable';
  description: string;
}

// Initial set of global variables and constants
export const initialGlobalVariables: GlobalVariable[] = [
  {
    id: 'global-1',
    name: 'TAX_MULTIPLIER',
    value: 1.0,
    type: 'constant',
    description: 'Standard tax multiplier for all calculations'
  },
  {
    id: 'global-2',
    name: 'BENEFITS_RATE',
    value: 0.1,
    type: 'constant',
    description: 'Standard benefits rate as percentage of salary'
  },
  {
    id: 'global-3',
    name: 'currentMonth',
    value: 'May',
    type: 'variable',
    description: 'Current payroll month'
  }
];
