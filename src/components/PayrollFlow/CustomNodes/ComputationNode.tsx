import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, AlertTriangle, RefreshCw, Info, Check } from 'lucide-react';
import { GlobalVariable } from '@/data/globalVariables';
import { 
  validateVariablesInExpression, 
  highlightExpressionVariables, 
  safeEvaluateExpression,
  validateVariableName,
  formatValueForDisplay,
  ValidationErrorType
} from '@/utils/flowUtils';

interface ComputationNodeProps {
  id: string;
  data: {
    label: string;
    formula: string;
    operation: string;
    resultVariable: string;
    variables: Record<string, any>;
    globalVariables: GlobalVariable[];
    onFormulaChange: (id: string, formula: string) => void;
    onOperationChange: (id: string, operation: string) => void;
    onResultVariableChange: (id: string, variable: string) => void;
    updateVariable?: (name: string, value: any) => void; 
  };
  selected: boolean;
}

const ComputationNode: React.FC<ComputationNodeProps> = ({ id, data, selected }) => {
  const [formula, setFormula] = useState(data.formula || '');
  const [resultVariable, setResultVariable] = useState(data.resultVariable || 'result');
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [variableNameError, setVariableNameError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Evaluate the formula with the current variables
  const evaluateFormula = () => {
    if (!formula) {
      setCalculatedResult(null);
      setCalculationError(null);
      setValidationErrors([]);
      return;
    }

    const allVariables = { ...data.variables };
    
    // Add global variables to the check
    data.globalVariables.forEach(variable => {
      allVariables[variable.name] = variable.value;
    });

    // Extract and validate variables
    const { validVariables, allValid, errors } = validateVariablesInExpression(formula, allVariables);
    setValidationResults(validVariables);
    
    // Set validation errors
    if (errors.length > 0) {
      setValidationErrors(errors.map(err => err.message));
    } else {
      setValidationErrors([]);
    }

    // Calculate the result if all variables are valid
    if (allValid) {
      try {
        setIsCalculating(true);
        
        // Use the safe evaluation function
        const { result, error } = safeEvaluateExpression(formula, allVariables);
        
        if (error) {
          setCalculatedResult(null);
          setCalculationError(error.message);
        } else {
          setCalculatedResult(result);
          setCalculationError(null);
          
          // Update the result variable in the parent component
          if (data.updateVariable && resultVariable) {
            data.updateVariable(resultVariable, result);
          }
        }
      } catch (error) {
        setCalculatedResult(null);
        setCalculationError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsCalculating(false);
      }
    } else {
      setCalculatedResult(null);
      setCalculationError("Cannot calculate: Some variables are missing or invalid");
    }
  };

  // Re-evaluate formula when it changes or when variables change
  useEffect(() => {
    evaluateFormula();
  }, [formula, data.variables, data.globalVariables, resultVariable]);

  // Update local state when props change
  useEffect(() => {
    setFormula(data.formula || '');
    setResultVariable(data.resultVariable || 'result');
  }, [data.formula, data.resultVariable]);

  const handleFormulaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFormula = e.target.value;
    setFormula(newFormula);
    data.onFormulaChange(id, newFormula);
  };

  const handleResultVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVariable = e.target.value;
    
    // Validate the variable name
    const { isValid, error } = validateVariableName(newVariable);
    setVariableNameError(error);
    
    setResultVariable(newVariable);
    
    if (isValid) {
      data.onResultVariableChange(id, newVariable);
    }
  };

  // Helper function to highlight variables in the formula
  const highlightFormula = () => {
    if (!formula) return null;
    return highlightExpressionVariables(formula, validationResults);
  };

  // Count available variables
  const availableVariableCount = Object.keys(data.variables).length + data.globalVariables.length;

  return (
    <Card className={`w-64 p-4 border-2 ${selected ? 'border-green-500' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-sm">{data.label || 'Computation'}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`formula-${id}`} className="text-xs">Formula</Label>
            <Badge variant="outline" className="text-xs">
              {validationErrors.length === 0 ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3 w-3" /> Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> {validationErrors.length} {validationErrors.length === 1 ? 'issue' : 'issues'}
                </span>
              )}
            </Badge>
          </div>
          <Textarea 
            id={`formula-${id}`}
            value={formula} 
            onChange={handleFormulaChange}
            className={`w-full ${validationErrors.length > 0 ? 'border-amber-300' : ''}`}
            placeholder="e.g., salary * (1 - taxRate) + bonus"
            rows={3}
          />
          {formula && (
            <div className="rounded-md bg-gray-50 p-2 text-sm">
              <p className="text-xs font-medium text-gray-500 mb-1">Preview:</p>
              {highlightFormula()}
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="text-xs text-amber-600 space-y-1 mt-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`variable-${id}`} className="text-xs">Result Variable</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">The name of the variable where the result will be stored</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id={`variable-${id}`}
            value={resultVariable} 
            onChange={handleResultVariableChange}
            className={`w-full ${variableNameError ? 'border-red-300' : ''}`}
          />
          {variableNameError && (
            <p className="text-xs text-red-500">{variableNameError}</p>
          )}
        </div>

        <div className={`rounded-md p-2 ${calculationError ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {calculationError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <Label className="text-xs text-red-700">Error</Label>
                </>
              ) : (
                <Label className="text-xs text-green-700">Result</Label>
              )}
            </div>
            <button 
              onClick={evaluateFormula} 
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-green-600"
              title="Recalculate"
            >
              <RefreshCw className={`h-3 w-3 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>
          <div className="mt-1">
            {calculationError ? (
              <p className="text-sm text-red-600">{calculationError}</p>
            ) : (
              <p className="text-sm font-medium">
                {calculatedResult !== null ? (
                  <>
                    <span className="text-green-800">{resultVariable}</span> = <span className="text-green-700">{formatValueForDisplay(calculatedResult)}</span>
                  </>
                ) : (
                  'Enter a valid formula to calculate'
                )}
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <p className="font-semibold">Available Variables:</p>
            <Badge variant="outline" className="text-xs">{availableVariableCount}</Badge>
          </div>
          <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
            {(() => {
              // Track displayed variable names to avoid duplicates
              const displayedVariables = new Set();
              
              // First show flow variables
              const flowVariableElements = Object.entries(data.variables).map(([varName, value]) => {
                displayedVariables.add(varName);
                return (
                  <TooltipProvider key={varName}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded cursor-help">
                          {varName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{varName}: {formatValueForDisplay(value)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              });
              
              // Then show global variables that haven't been displayed yet
              const globalVariableElements = data.globalVariables
                .filter(variable => !displayedVariables.has(variable.name))
                .map(variable => (
                  <TooltipProvider key={variable.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded cursor-help">
                          {variable.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{variable.name}: {formatValueForDisplay(variable.value)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ));
              
              // Return combined elements
              return [...flowVariableElements, ...globalVariableElements];
            })()}
          </div>
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: -6 }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </Card>
  );
};

export default ComputationNode;
