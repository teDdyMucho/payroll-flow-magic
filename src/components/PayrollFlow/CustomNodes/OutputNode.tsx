import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Employee } from '@/data/employeeData';
import { User, Check, FileOutput, ArrowRightToLine, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { detectEmployeesInVariables, formatValueForDisplay } from '@/utils/flowUtils';
import { updateEmployee } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

interface OutputNodeProps {
  id: string;
  data: {
    variables?: Record<string, any>;
    employees?: Employee[];
    setEmployees?: (employees: Employee[]) => void;
    connectedEmployeeId?: string | null;
    outputName?: string;
    description?: string;
    onOutputNameChange?: (id: string, name: string) => void;
    onDescriptionChange?: (id: string, description: string) => void;
    selectedVariable?: string;
    onSelectedVariableChange?: (id: string, variable: string) => void;
    selectedField?: string;
    onSelectedFieldChange?: (id: string, field: string) => void;
  };
  selected: boolean;
}

const OutputNode: React.FC<OutputNodeProps> = ({ id, data, selected }) => {
  const [selectedVariable, setSelectedVariable] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [outputName, setOutputName] = useState<string>(data.outputName || 'Output');
  const [description, setDescription] = useState<string>(data.description || '');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(false);
  const [detectedEmployees, setDetectedEmployees] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [hasMultipleEmployeeNodes, setHasMultipleEmployeeNodes] = useState<boolean>(false);

  useEffect(() => {
    // Update local state from props when they change
    setOutputName(data.outputName || 'Output');
    setDescription(data.description || '');
    
    // If we have selectedVariable and selectedField in the node data, use them
    if (data.selectedVariable) setSelectedVariable(data.selectedVariable);
    if (data.selectedField) setSelectedField(data.selectedField);
  }, [data.outputName, data.description, data.selectedVariable, data.selectedField]);

  const detectAndSelectEmployee = useCallback(() => {
    if (!data.variables || !data.employees?.length) return false;
    
    try {
      // If we have a directly connected employee ID, always use that
      if (data.connectedEmployeeId && data.employees.some(e => e.id === data.connectedEmployeeId)) {
        setSelectedEmployee(data.connectedEmployeeId);
        setHasMultipleEmployeeNodes(false);
        setUpdateError(null);
        setDetectedEmployees([data.connectedEmployeeId]);
        return true;
      }

      // Keep using currently selected employee if it's valid
      if (selectedEmployee && data.employees.some(e => e.id === selectedEmployee)) {
        setHasMultipleEmployeeNodes(false);
        setUpdateError(null);
        setDetectedEmployees([selectedEmployee]);
        return true;
      }

      // Default to first employee if no specific selection needed
      setSelectedEmployee(data.employees[0].id);
      setHasMultipleEmployeeNodes(false);
      setUpdateError(null);
      setDetectedEmployees([data.employees[0].id]);
      return true;
    } catch (error) {
      console.error("Error detecting employees:", error);
      return false;
    }
  }, [data.variables, data.connectedEmployeeId, data.employees, selectedEmployee]);

  useEffect(() => {
    detectAndSelectEmployee();
  }, [detectAndSelectEmployee]);

  useEffect(() => {
    if (selectedEmployee && !selectedField) {
      const fields = getFieldOptions();
      if (fields.length > 0) {
        setSelectedField(fields[0]);
      }
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (data.variables && Object.keys(data.variables).length > 0 && !selectedVariable) {
      setSelectedVariable(Object.keys(data.variables)[0]);
    }
  }, [data.variables]);

  useEffect(() => {
    if (autoUpdateEnabled && selectedEmployee && selectedField && selectedVariable && !isUpdating && !hasMultipleEmployeeNodes) {
      handleUpdateEmployeeField();
    }
  }, [selectedEmployee, selectedField, selectedVariable, autoUpdateEnabled, hasMultipleEmployeeNodes]);

  const handleOutputNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setOutputName(newName);
    if (data.onOutputNameChange) {
      data.onOutputNameChange(id, newName);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (data.onDescriptionChange) {
      data.onDescriptionChange(id, newDescription);
    }
  };

  const handleUpdateEmployeeField = async () => {
    setUpdateError(null);
    setIsUpdating(true);
    
    try {
      if (!selectedEmployee || !selectedField || !selectedVariable || !data.setEmployees || !data.employees) {
        setUpdateError("Missing information. Please select an employee, field, and variable to update.");
        setIsUpdating(false);
        return;
      }

      if (!data.variables || !(selectedVariable in data.variables)) {
        setUpdateError(`The variable "${selectedVariable}" is not available.`);
        setIsUpdating(false);
        return;
      }

      const employeeIndex = data.employees.findIndex(emp => emp.id === selectedEmployee);
      if (employeeIndex === -1) {
        setUpdateError("The selected employee could not be found.");
        setIsUpdating(false);
        return;
      }

      const updatedEmployees = [...data.employees];
      const variableValue = data.variables[selectedVariable];
      
      // Update the employee in the local state
      updatedEmployees[employeeIndex] = {
        ...updatedEmployees[employeeIndex],
        fields: {
          ...updatedEmployees[employeeIndex].fields,
          [selectedField]: variableValue
        }
      };
      
      // Update the employee in Firestore
      try {
        await updateEmployee(selectedEmployee, { 
          fields: {
            ...updatedEmployees[employeeIndex].fields
          }
        });
        
        // Show success toast
        toast({
          title: "Employee updated",
          description: `Field "${selectedField}" updated to "${formatValueForDisplay(variableValue)}" for ${updatedEmployees[employeeIndex].name}`,
          variant: "default"
        });
      } catch (firestoreError) {
        console.error("Error updating employee in Firestore:", firestoreError);
        setUpdateError(`Firestore update failed: ${firestoreError instanceof Error ? firestoreError.message : String(firestoreError)}`);
        
        // Show error toast
        toast({
          title: "Update failed",
          description: `Failed to update employee in Firestore: ${firestoreError instanceof Error ? firestoreError.message : String(firestoreError)}`,
          variant: "destructive"
        });
      }
      
      // Update the local state
      data.setEmployees(updatedEmployees);
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error("Error updating employee:", error);
      setUpdateError(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getFieldOptions = () => {
    if (!data.employees || !selectedEmployee) return [];
    
    const employee = data.employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return [];
    
    return Object.keys(employee.fields);
  };

  const getSelectedEmployeeName = () => {
    if (!data.employees || !selectedEmployee) return 'No employee selected';
    
    const employee = data.employees.find(emp => emp.id === selectedEmployee);
    return employee ? employee.name : 'Unknown employee';
  };

  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return 'Never';
    return lastUpdateTime.toLocaleTimeString();
  };

  const getVariableValuePreview = () => {
    if (!data.variables || !selectedVariable) return '';
    const value = data.variables[selectedVariable];
    return formatValueForDisplay(value);
  };

  // Save selected variable and field to node data
  useEffect(() => {
    if (selectedVariable && data.onSelectedVariableChange) {
      data.onSelectedVariableChange(id, selectedVariable);
    }
  }, [id, selectedVariable, data.onSelectedVariableChange]);

  useEffect(() => {
    if (selectedField && data.onSelectedFieldChange) {
      data.onSelectedFieldChange(id, selectedField);
    }
  }, [id, selectedField, data.onSelectedFieldChange]);

  return (
    <Card className={`w-72 shadow-md ${selected ? 'border-blue-500 border-2' : 'border'}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileOutput className="h-4 w-4 text-blue-500" />
              <Input 
                value={outputName} 
                onChange={handleOutputNameChange} 
                className="h-6 py-1 px-2 text-sm font-medium"
                placeholder="Output Name"
              />
            </div>
            
            {selected && (
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Switch 
                          checked={autoUpdateEnabled} 
                          onCheckedChange={setAutoUpdateEnabled}
                        />
                        <span className="ml-1 text-xs text-gray-500">Auto</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Automatically update employee field when values change</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={description}
                onChange={handleDescriptionChange}
                className="w-full text-sm"
                placeholder="Enter a description"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Variable to Use</Label>
              <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select variable" />
                </SelectTrigger>
                <SelectContent>
                  {data.variables && Object.keys(data.variables).length > 0 ? (
                    Object.keys(data.variables).map(variable => (
                      <SelectItem key={variable} value={variable}>{variable}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-gray-500">
                      <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                      No variables available
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              {selectedVariable && (
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Value:</span>
                    <span className="text-xs text-blue-600 font-mono">{getVariableValuePreview()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{getSelectedEmployeeName()}</span>
              </div>
              {selectedEmployee && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-blue-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Employee ID: {selectedEmployee}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Employee Field to Update</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions().length > 0 ? (
                    getFieldOptions().map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-gray-500">
                      <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                      No fields available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor={`auto-update-${id}`} className="text-xs cursor-pointer">
                Auto-update field
              </Label>
              <Switch
                id={`auto-update-${id}`}
                checked={autoUpdateEnabled}
                onCheckedChange={setAutoUpdateEnabled}
              />
            </div>

            {!autoUpdateEnabled && (
              <Button 
                onClick={handleUpdateEmployeeField} 
                className="w-full flex items-center justify-center gap-2"
                disabled={isUpdating || !selectedEmployee || !selectedField || !selectedVariable}
                variant="outline"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightToLine className="h-4 w-4" />
                    <span>Update Field</span>
                  </>
                )}
              </Button>
            )}

            {updateError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-1.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{updateError}</p>
                </div>
              </div>
            )}

            {lastUpdateTime && (
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>Last updated:</span>
                <span>{formatLastUpdateTime()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#555' }}
      />
    </Card>
  );
};

export default OutputNode;