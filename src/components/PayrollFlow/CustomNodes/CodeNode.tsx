import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Code } from 'lucide-react';
import { GlobalVariable } from '@/data/globalVariables';
import { validateVariablesInExpression, highlightExpressionVariables } from '@/utils/flowUtils';

interface CodeNodeProps {
  id: string;
  data: {
    label: string;
    code: string;
    outputVariable: string;
    variables: Record<string, any>;
    globalVariables: GlobalVariable[];
    onCodeChange: (id: string, code: string) => void;
    onOutputVariableChange: (id: string, outputVariable: string) => void;
  };
  selected: boolean;
}

const CodeNode: React.FC<CodeNodeProps> = ({ id, data, selected }) => {
  const [code, setCode] = useState(data.code || '');
  const [outputVariable, setOutputVariable] = useState(data.outputVariable || 'result');
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});

  // Update local state when props change
  useEffect(() => {
    setCode(data.code || '');
    setOutputVariable(data.outputVariable || 'result');
  }, [data.code, data.outputVariable]);

  // Check which variables in the code are valid
  useEffect(() => {
    if (!code) return;

    const allVariables = { ...data.variables };
    
    // Add global variables to the check
    data.globalVariables.forEach(variable => {
      allVariables[variable.name] = variable.value;
    });

    // Validate variables in the code
    const { validVariables } = validateVariablesInExpression(code, allVariables, true);
    setValidationResults(validVariables);
  }, [code, data.variables, data.globalVariables]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    data.onCodeChange(id, newCode);
  };

  const handleOutputVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOutputVariable = e.target.value;
    setOutputVariable(newOutputVariable);
    data.onOutputVariableChange(id, newOutputVariable);
  };

  // Helper function to highlight variables in the code
  const highlightCode = () => {
    if (!code) return null;
    return highlightExpressionVariables(code, validationResults, true);
  };

  return (
    <Card className={`w-64 p-4 border-2 ${selected ? 'border-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Code className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-sm">{data.label || 'Custom Code'}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`code-${id}`} className="text-xs">JavaScript Code</Label>
          <Textarea 
            id={`code-${id}`}
            value={code} 
            onChange={handleCodeChange}
            className="w-full font-mono text-xs" 
            placeholder="// Write your code here\nreturn salary * 1.1;"
            rows={5}
          />
          {code && (
            <div className="rounded-md bg-gray-50 p-2 text-sm border overflow-auto max-h-24">
              <p className="text-xs font-medium text-gray-500 mb-1">Preview:</p>
              {highlightCode()}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`output-${id}`} className="text-xs">Output Variable</Label>
          <Input 
            id={`output-${id}`}
            value={outputVariable} 
            onChange={handleOutputVariableChange}
            className="w-full" 
          />
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

      {/* Input and output handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </Card>
  );
};

export default CodeNode;
