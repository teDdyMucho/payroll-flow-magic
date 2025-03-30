import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Code } from 'lucide-react';
import { GlobalVariable } from '@/data/globalVariables';
import { validateVariablesInExpression, highlightExpressionVariables } from '@/utils/flowUtils';

interface ElseIfNodeProps {
  
  id: string;
  data: {
    label: string;
    condition: string;
    truePath: string;
    falsePath: string;
    variables: Record<string, any>;
    globalVariables: GlobalVariable[];
    onConditionChange: (id: string, condition: string) => void;
    onTruePathChange: (id: string, truePath: string) => void;
    onFalsePathChange: (id: string, falsePath: string) => void;
  };
  selected: boolean;
}

const ElseIfNode: React.FC<ElseIfNodeProps> = ({ id, data, selected }) => {
  const [condition, setCondition] = useState(data.condition || '');
  const [truePath, setTruePath] = useState(data.truePath || 'true');
  const [falsePath, setFalsePath] = useState(data.falsePath || 'false');
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});

  // Update local state when props change
  useEffect(() => {
    setCondition(data.condition || '');
    setTruePath(data.truePath || 'true');
    setFalsePath(data.falsePath || 'false');
  }, [data.condition, data.truePath, data.falsePath]);

  // Check which variables in the condition are valid
  useEffect(() => {
    if (!condition) return;

    const allVariables = { ...data.variables };
    
    // Add global variables to the check
    data.globalVariables.forEach(variable => {
      allVariables[variable.name] = variable.value;
    });

    // Validate variables in the condition
    const { validVariables } = validateVariablesInExpression(condition, allVariables);
    setValidationResults(validVariables);
  }, [condition, data.variables, data.globalVariables]);

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCondition = e.target.value;
    setCondition(newCondition);
    data.onConditionChange(id, newCondition);
  };

  const handleTruePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTruePath = e.target.value;
    setTruePath(newTruePath);
    data.onTruePathChange(id, newTruePath);
  };

  const handleFalsePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFalsePath = e.target.value;
    setFalsePath(newFalsePath);
    data.onFalsePathChange(id, newFalsePath);
  };

  // Helper function to highlight variables in the condition
  const highlightCondition = () => {
    if (!condition) return null;
    return highlightExpressionVariables(condition, validationResults);
  };

  return (
    <Card className={`w-64 p-4 border-2 ${selected ? 'border-orange-500' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Code className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-sm">{data.label || 'Condition'}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`condition-${id}`} className="text-xs">Condition</Label>
          <Input 
            id={`condition-${id}`}
            value={condition} 
            onChange={handleConditionChange}
            className="w-full" 
            placeholder="e.g., salary > 5000"
          />
          {condition && (
            <div className="rounded-md bg-gray-50 p-2 text-sm">
              <p className="text-xs font-medium text-gray-500 mb-1">Preview:</p>
              {highlightCondition()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor={`true-${id}`} className="text-xs">If True (Output Variable)</Label>
            <Input 
              id={`true-${id}`}
              value={truePath} 
              onChange={handleTruePathChange}
              className="w-full" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`false-${id}`} className="text-xs">If False (Output Variable)</Label>
            <Input 
              id={`false-${id}`}
              value={falsePath} 
              onChange={handleFalsePathChange}
              className="w-full" 
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2 mt-2">
          <p className="font-semibold">Available Variables:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.keys(data.variables).map(varName => (
              <span key={varName} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                {varName}
              </span>
            ))}
            {data.globalVariables.map(variable => (
              <span 
                key={variable.id} 
                className={`px-1.5 py-0.5 rounded ${
                  variable.type === 'constant' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {variable.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true-output"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: -6, top: '35%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false-output"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ right: -6, top: '65%' }}
      />
    </Card>
  );
};

export default ElseIfNode;
