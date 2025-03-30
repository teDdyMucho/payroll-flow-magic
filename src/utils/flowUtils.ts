/**
 * Utility functions for the payroll flow system
 */
import React from 'react';

/**
 * JavaScript keywords and common function names to exclude from variable validation
 */
const JS_KEYWORDS = [
  'return', 'if', 'else', 'function', 'const', 'let', 'var', 
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 
  'default', 'try', 'catch', 'finally', 'throw', 'new', 'this', 
  'typeof', 'instanceof', 'in', 'Math', 'String', 'Number', 
  'Boolean', 'Array', 'Object', 'console', 'log', 'parseInt', 
  'parseFloat', 'isNaN', 'isFinite', 'true', 'false', 'null', 'undefined'
];

/**
 * Common mathematical operators and functions
 */
const MATH_OPERATORS = [
  '+', '-', '*', '/', '%', '**', '=', '==', '===', '!=', '!==',
  '>', '<', '>=', '<=', '&&', '||', '!', '&', '|', '^', '~',
  '<<', '>>', '>>>', '++', '--', '+=', '-=', '*=', '/=', '%=',
  'Math.abs', 'Math.ceil', 'Math.floor', 'Math.round', 'Math.max',
  'Math.min', 'Math.pow', 'Math.sqrt', 'Math.sin', 'Math.cos',
  'Math.tan', 'Math.log', 'Math.exp', 'Math.random'
];

/**
 * Error types for validation
 */
export enum ValidationErrorType {
  MISSING_VARIABLE = 'missing_variable',
  SYNTAX_ERROR = 'syntax_error',
  TYPE_ERROR = 'type_error',
  EVALUATION_ERROR = 'evaluation_error',
  UNDEFINED_ERROR = 'undefined_error'
}

/**
 * Interface for validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  variableName?: string;
}

/**
 * Validates variables in an expression against available variables
 * @param expression The expression to validate (formula, condition, code)
 * @param availableVariables Object containing available variables and their values
 * @param excludeKeywords Whether to exclude JavaScript keywords from validation
 * @returns Object with validVariables (map of variable names to validity) and allValid (boolean)
 */
export function validateVariablesInExpression(
  expression: string,
  availableVariables: Record<string, any>,
  excludeKeywords = true
): { validVariables: Record<string, boolean>; allValid: boolean; errors: ValidationError[] } {
  const validVariables: Record<string, boolean> = {};
  const errors: ValidationError[] = [];
  let allValid = true;

  if (!expression || expression.trim() === '') {
    return { validVariables, allValid: false, errors: [
      { type: ValidationErrorType.SYNTAX_ERROR, message: 'Expression is empty' }
    ]};
  }

  try {
    // Check for basic syntax errors
    new Function(`return ${expression};`);
  } catch (error) {
    return { validVariables, allValid: false, errors: [
      { type: ValidationErrorType.SYNTAX_ERROR, message: `Syntax error: ${error instanceof Error ? error.message : String(error)}` }
    ]};
  }

  // Extract variable names from the expression
  const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const matches = expression.match(variablePattern) || [];
  
  // Check each variable
  matches.forEach(varName => {
    // Skip JavaScript keywords if requested
    if (excludeKeywords && JS_KEYWORDS.includes(varName)) {
      return;
    }
    
    const isValid = availableVariables.hasOwnProperty(varName);
    validVariables[varName] = isValid;
    
    if (!isValid) {
      allValid = false;
      errors.push({
        type: ValidationErrorType.MISSING_VARIABLE,
        message: `Variable '${varName}' is not defined`,
        variableName: varName
      });
    }
  });

  return { validVariables, allValid, errors };
}

/**
 * Highlights variables in an expression with color coding based on validity
 * @param expression The expression to highlight
 * @param validationResults Map of variable names to validity
 * @param excludeKeywords Whether to exclude JavaScript keywords from validation
 * @returns Array of React elements with highlighted variables
 */
export function highlightExpressionVariables(
  expression: string,
  validationResults: Record<string, boolean>,
  excludeKeywords = true
): React.ReactNode {
  if (!expression) return null;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let match;
  
  while ((match = variablePattern.exec(expression)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(React.createElement('span', { key: `t-${lastIndex}` }, expression.substring(lastIndex, match.index)));
    }
    
    // Add the highlighted variable
    const varName = match[0];
    
    // Handle JavaScript keywords
    if (excludeKeywords && JS_KEYWORDS.includes(varName)) {
      parts.push(
        React.createElement('span', 
          { key: `v-${match.index}`, className: "text-blue-600 font-medium" }, 
          varName
        )
      );
    } else if (MATH_OPERATORS.includes(varName)) {
      // Highlight math operators
      parts.push(
        React.createElement('span', 
          { key: `v-${match.index}`, className: "text-purple-600 font-medium" }, 
          varName
        )
      );
    } else {
      const isValid = validationResults[varName];
      parts.push(
        React.createElement('span', 
          { 
            key: `v-${match.index}`, 
            className: isValid ? 'text-green-600 font-medium' : 'text-red-500 font-medium',
            title: isValid ? 'Valid variable' : 'Undefined variable'
          }, 
          varName
        )
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < expression.length) {
    parts.push(React.createElement('span', { key: `t-${lastIndex}` }, expression.substring(lastIndex)));
  }
  
  return React.createElement('div', null, parts);
}

/**
 * Detects employee references in variables
 * @param variables The variables object to check for employee references
 * @returns Array of employee IDs found in the variables
 */
export function detectEmployeesInVariables(variables: Record<string, any>): string[] {
  const employeeIds: string[] = [];
  
  if (!variables || typeof variables !== 'object') {
    return employeeIds;
  }
  
  // Check all variables for potential employee references
  Object.entries(variables).forEach(([key, value]) => {
    // If key contains 'employee' or 'emp' and value is a string that looks like an ID
    if ((key.toLowerCase().includes('employee') || key.toLowerCase().includes('emp')) && 
        typeof value === 'string' && value.match(/^[a-zA-Z0-9-]+$/)) {
      employeeIds.push(value);
    }
    // If value is a string that looks like an ID
    else if (typeof value === 'string' && value.match(/^[a-zA-Z0-9-]+$/)) {
      employeeIds.push(value);
    }
    // If value is an object with an id property
    else if (value && typeof value === 'object') {
      if ('id' in value && typeof value.id === 'string') {
        employeeIds.push(value.id);
      }
      // If value is an object with employeeId property
      else if ('employeeId' in value && typeof value.employeeId === 'string') {
        employeeIds.push(value.employeeId);
      }
    }
  });
  
  // Remove duplicates
  return [...new Set(employeeIds)];
}

/**
 * Safely evaluates a mathematical expression with given variables
 * @param expression The expression to evaluate
 * @param variables Object containing variables and their values
 * @returns Result of the evaluation or error object
 */
export function safeEvaluateExpression(
  expression: string,
  variables: Record<string, any>
): { result: any; error: ValidationError | null } {
  if (!expression || expression.trim() === '') {
    return {
      result: null,
      error: {
        type: ValidationErrorType.SYNTAX_ERROR,
        message: 'Expression is empty'
      }
    };
  }

  try {
    // First validate the expression
    const { allValid, errors } = validateVariablesInExpression(expression, variables);
    
    if (!allValid) {
      return {
        result: null,
        error: errors[0] // Return the first error
      };
    }
    
    // Create a safe evaluation context with only the variables we need
    const evalContext = { ...variables };
    
    // Create a function that evaluates the expression in the context of our variables
    const evalFunction = new Function(...Object.keys(evalContext), `return ${expression};`);
    
    // Call the function with our variable values
    const result = evalFunction(...Object.values(evalContext));
    
    return { result, error: null };
  } catch (error) {
    return {
      result: null,
      error: {
        type: ValidationErrorType.EVALUATION_ERROR,
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Formats a value for display based on its type
 * @param value The value to format
 * @returns Formatted string representation of the value
 */
export function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'number') {
    // Format number with up to 2 decimal places, but only if needed
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Complex Object]';
    }
  }
  
  return String(value);
}

/**
 * Validates if a variable name is valid for use in JavaScript
 * @param name The variable name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateVariableName(name: string): { isValid: boolean; error: string | null } {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Variable name cannot be empty' };
  }
  
  // Check if name starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(name)) {
    return { isValid: false, error: 'Variable name must start with a letter or underscore' };
  }
  
  // Check if name contains only letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { isValid: false, error: 'Variable name can only contain letters, numbers, and underscores' };
  }
  
  // Check if name is a reserved JavaScript keyword
  if (JS_KEYWORDS.includes(name)) {
    return { isValid: false, error: `'${name}' is a reserved JavaScript keyword` };
  }
  
  return { isValid: true, error: null };
}
