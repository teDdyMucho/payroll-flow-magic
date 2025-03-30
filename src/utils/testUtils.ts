/**
 * Test utilities for the payroll flow system
 * These functions help with testing and debugging the flow components
 */
import { Employee } from '@/data/employeeData';
import { GlobalVariable } from '@/data/globalVariables';
import { validateVariablesInExpression, ValidationErrorType } from './flowUtils';

/**
 * Generate a mock employee for testing
 * @param id Optional ID for the employee (defaults to a random ID)
 * @param name Optional name for the employee (defaults to "Test Employee")
 * @returns A mock employee with test data
 */
export function createMockEmployee(id?: string, name?: string): Employee {
  const employeeId = id || `emp-${Math.floor(Math.random() * 10000)}`;
  const employeeName = name || `Test Employee ${Math.floor(Math.random() * 100)}`;
  
  return {
    id: employeeId,
    name: employeeName,
    position: 'Test Position',
    department: 'Test Department',
    fields: {
      baseSalary: 50000,
      hourlyRate: 25,
      hoursWorked: 40,
      taxRate: 0.2,
      bonus: 1000,
      deductions: 500,
      startDate: '2023-01-01',
      employeeType: 'Full-time'
    }
  };
}

/**
 * Generate a set of test variables for flow testing
 * @param includeEmployeeId Whether to include an employee ID in the variables
 * @returns An object with test variables
 */
export function createTestVariables(includeEmployeeId = true): Record<string, any> {
  const variables: Record<string, any> = {
    salary: 50000,
    hourlyRate: 25,
    hoursWorked: 40,
    taxRate: 0.2,
    bonus: 1000,
    deductions: 500,
    netSalary: 39500,
    overtimeHours: 5,
    overtimeRate: 1.5
  };
  
  if (includeEmployeeId) {
    variables.employeeId = 'emp-123';
  }
  
  return variables;
}

/**
 * Validate a formula with test variables
 * @param formula The formula to validate
 * @returns Validation results
 */
export function validateTestFormula(formula: string) {
  const testVariables = createTestVariables();
  return validateVariablesInExpression(formula, testVariables);
}

/**
 * Create a mock node data object for testing
 * @param type The type of node to create data for
 * @returns Mock node data
 */
export function createMockNodeData(type: 'employee' | 'computation' | 'output' | 'elseIf' | 'code') {
  const testVariables = createTestVariables();
  const testEmployees = [createMockEmployee('emp-123', 'Test Employee 1')];
  const testGlobalVariables: GlobalVariable[] = [
    { id: 'global-1', name: 'taxRate', value: 0.2, type: 'constant' },
    { id: 'global-2', name: 'minWage', value: 15, type: 'constant' }
  ];
  
  const mockCallbacks = {
    onFieldChange: () => {},
    onVariableNameChange: () => {},
    onEmployeeChange: () => {},
    onCustomFieldsChange: () => {},
    onFormulaChange: () => {},
    onOperationChange: () => {},
    onResultVariableChange: () => {},
    updateVariable: () => {},
    onOutputNameChange: () => {},
    onDescriptionChange: () => {},
    onConditionChange: () => {},
    onTruePathChange: () => {},
    onFalsePathChange: () => {},
    onCodeChange: () => {},
    onOutputVariableChange: () => {},
    setEmployees: () => {}
  };
  
  switch (type) {
    case 'employee':
      return {
        label: 'Test Employee Node',
        sourceField: 'baseSalary',
        variableName: 'salary',
        employeeId: 'emp-123',
        employees: testEmployees,
        customFields: [],
        ...mockCallbacks
      };
    
    case 'computation':
      return {
        label: 'Test Computation Node',
        operation: 'multiply',
        formula: 'salary * (1 - taxRate)',
        resultVariable: 'netSalary',
        variables: testVariables,
        globalVariables: testGlobalVariables,
        ...mockCallbacks
      };
    
    case 'output':
      return {
        outputName: 'Test Output',
        description: 'Test output description',
        variables: testVariables,
        employees: testEmployees,
        connectedEmployeeId: 'emp-123',
        ...mockCallbacks
      };
    
    case 'elseIf':
      return {
        label: 'Test Else-If Node',
        condition: 'salary > 40000',
        truePath: 'highTax',
        falsePath: 'lowTax',
        variables: testVariables,
        globalVariables: testGlobalVariables,
        ...mockCallbacks
      };
    
    case 'code':
      return {
        label: 'Test Code Node',
        code: 'return salary * (1 - taxRate) + bonus;',
        outputVariable: 'netSalary',
        variables: testVariables,
        globalVariables: testGlobalVariables,
        ...mockCallbacks
      };
  }
}

/**
 * Log node data for debugging
 * @param nodeType The type of node
 * @param data The node data
 */
export function debugNodeData(nodeType: string, data: any) {
  console.group(`Debug ${nodeType} Node`);
  console.log('Data:', data);
  
  if (data.variables) {
    console.group('Variables:');
    Object.entries(data.variables).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  }
  
  if (data.employees) {
    console.group('Employees:');
    data.employees.forEach((emp: Employee) => {
      console.log(`${emp.id} - ${emp.name}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}
