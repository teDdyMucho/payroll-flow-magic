import React, { useState, useEffect } from 'react';
import { GlobalVariable } from '@/data/globalVariables';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Variable, Plus, Trash, Edit, Save, X } from 'lucide-react';
import { 
  addGlobalVariable, 
  updateGlobalVariable, 
  deleteGlobalVariable,
  globalVarsRef 
} from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';

interface GlobalVariablesManagerProps {
  globalVariables: GlobalVariable[];
  setGlobalVariables: React.Dispatch<React.SetStateAction<GlobalVariable[]>>;
}

const GlobalVariablesManager: React.FC<GlobalVariablesManagerProps> = ({ 
  globalVariables, 
  setGlobalVariables 
}) => {
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newVariable, setNewVariable] = useState<Omit<GlobalVariable, 'id'>>({
    name: '',
    value: '',
    type: 'variable',
    description: ''
  });

  // Set up real-time sync with Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(globalVarsRef, (snapshot) => {
      const globalVarsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlobalVariable[];
      setGlobalVariables(globalVarsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setGlobalVariables]);

  const handleAddVariable = async () => {
    try {
      if (!newVariable.name) {
        toast({
          title: "Error",
          description: "Variable name is required",
          variant: "destructive"
        });
        return;
      }

      // Check if variable name already exists
      if (globalVariables.some(v => v.name === newVariable.name)) {
        toast({
          title: "Error",
          description: "A variable with this name already exists",
          variant: "destructive"
        });
        return;
      }

      const newId = `global-${Date.now()}`;
      await addGlobalVariable(newId, newVariable);
      
      setNewVariable({
        name: '',
        value: '',
        type: 'variable',
        description: ''
      });
      
      setIsAddingVariable(false);
      
      toast({
        title: "Success",
        description: "Variable added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add variable",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVariable = async (id: string) => {
    try {
      const variableToUpdate = globalVariables.find(v => v.id === id);
      if (!variableToUpdate) return;

      await updateGlobalVariable(id, newVariable);
      
      setEditingVariableId(null);
      
      toast({
        title: "Success",
        description: "Variable updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variable",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      await deleteGlobalVariable(id);
      
      toast({
        title: "Success",
        description: "Variable deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete variable",
        variant: "destructive"
      });
    }
  };

  const startEditing = (variable: GlobalVariable) => {
    setNewVariable({
      name: variable.name,
      value: variable.value,
      type: variable.type,
      description: variable.description
    });
    setEditingVariableId(variable.id);
  };

  const cancelEditing = () => {
    setEditingVariableId(null);
    if (!isAddingVariable) {
      setNewVariable({
        name: '',
        value: '',
        type: 'variable',
        description: ''
      });
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Global Variables</h2>
          <p className="text-gray-500">Manage global variables and constants for all payroll flows</p>
        </div>
        {!isAddingVariable && (
          <Button 
            onClick={() => setIsAddingVariable(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Variable
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center p-10 border rounded-md bg-gray-50">
          <Variable className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">Loading...</h3>
        </div>
      ) : (
        <>
          {isAddingVariable && (
            <Card className="p-4 mb-6 border-blue-300 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Variable className="h-5 w-5 mr-2 text-blue-500" />
                New Global Variable
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variable-name">Variable Name</Label>
                  <Input 
                    id="variable-name" 
                    value={newVariable.name} 
                    onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                    placeholder="E.g., TAX_RATE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variable-type">Type</Label>
                  <Select 
                    value={newVariable.type} 
                    onValueChange={(value) => setNewVariable({...newVariable, type: value as 'constant' | 'variable'})}
                  >
                    <SelectTrigger id="variable-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constant">Constant</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variable-value">Value</Label>
                  <Input 
                    id="variable-value" 
                    value={String(newVariable.value)} 
                    onChange={(e) => {
                      // Try to convert to number if it looks like a number
                      const numValue = Number(e.target.value);
                      const newValue = !isNaN(numValue) && e.target.value.trim() !== '' 
                        ? numValue 
                        : e.target.value;
                      
                      setNewVariable({...newVariable, value: newValue});
                    }}
                    placeholder="Enter value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variable-description">Description</Label>
                  <Textarea 
                    id="variable-description" 
                    value={String(newVariable.description)} 
                    onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                    placeholder="Description of this variable"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddingVariable(false);
                  setNewVariable({
                    name: '',
                    value: '',
                    type: 'variable',
                    description: ''
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddVariable}>
                  Add Variable
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {globalVariables.map((variable) => (
              <Card 
                key={variable.id} 
                className={`p-4 ${
                  editingVariableId === variable.id
                    ? 'border-blue-300 bg-blue-50'
                    : variable.type === 'constant' 
                      ? 'border-purple-200 bg-purple-50' 
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                {editingVariableId === variable.id ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Variable className="h-5 w-5 mr-2 text-blue-500" />
                      Edit Variable
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-name-${variable.id}`}>Variable Name</Label>
                        <Input 
                          id={`edit-name-${variable.id}`} 
                          value={newVariable.name} 
                          onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-type-${variable.id}`}>Type</Label>
                        <Select 
                          value={newVariable.type} 
                          onValueChange={(value) => setNewVariable({...newVariable, type: value as 'constant' | 'variable'})}
                        >
                          <SelectTrigger id={`edit-type-${variable.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="constant">Constant</SelectItem>
                            <SelectItem value="variable">Variable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-value-${variable.id}`}>Value</Label>
                        <Input 
                          id={`edit-value-${variable.id}`} 
                          value={String(newVariable.value)} 
                          onChange={(e) => {
                            // Try to convert to number if it looks like a number
                            const numValue = Number(e.target.value);
                            const newValue = !isNaN(numValue) && e.target.value.trim() !== '' 
                              ? numValue 
                              : e.target.value;
                            
                            setNewVariable({...newVariable, value: newValue});
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-desc-${variable.id}`}>Description</Label>
                        <Textarea 
                          id={`edit-desc-${variable.id}`} 
                          value={String(newVariable.description)} 
                          onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button onClick={() => handleUpdateVariable(variable.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          variable.type === 'constant' 
                            ? 'bg-purple-200 text-purple-800' 
                            : 'bg-blue-200 text-blue-800'
                        }`}>
                          <Variable className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {variable.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              variable.type === 'constant' 
                                ? 'bg-purple-200 text-purple-800' 
                                : 'bg-blue-200 text-blue-800'
                            }`}>
                              {variable.type}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {typeof variable.value === 'number' 
                                ? variable.value.toString() 
                                : `"${variable.value}"`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => startEditing(variable)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteVariable(variable.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-500 mt-2 text-sm">
                      {variable.description || 'No description provided'}
                    </p>
                  </div>
                )}
              </Card>
            ))}
            
            {globalVariables.length === 0 && !isAddingVariable && (
              <div className="text-center p-10 border rounded-md bg-gray-50">
                <Variable className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No Global Variables</h3>
                <p className="text-gray-500 mt-1 mb-4">
                  Add variables and constants that will be available across all payroll flows
                </p>
                <Button onClick={() => setIsAddingVariable(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Variable
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalVariablesManager;
