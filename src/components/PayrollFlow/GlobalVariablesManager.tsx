import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { GlobalVariable } from '@/types/database';
import { 
  addGlobalVariable, 
  updateGlobalVariable, 
  deleteGlobalVariable,
  globalVariablesRef
} from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';

interface GlobalVariablesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalVariablesManager: React.FC<GlobalVariablesManagerProps> = ({ isOpen, onClose }) => {
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newVariable, setNewVariable] = useState<Omit<GlobalVariable, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    value: '',
    type: 'string',
    description: ''
  });
  const [editingVariable, setEditingVariable] = useState<GlobalVariable | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set up real-time sync with Firestore for global variables
  useEffect(() => {
    const unsubscribe = onSnapshot(globalVariablesRef, (snapshot) => {
      const globalVarsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlobalVariable[];
      setGlobalVariables(globalVarsData);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setNewVariable({
      name: '',
      value: '',
      type: 'string',
      description: ''
    });
    setEditingVariable(null);
  };

  const handleAddVariable = async () => {
    try {
      setIsLoading(true);
      
      if (!newVariable.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for the variable",
          variant: "destructive"
        });
        return;
      }

      // Check if variable name already exists
      if (globalVariables.some(v => v.name === newVariable.name)) {
        toast({
          title: "Duplicate name",
          description: "A variable with this name already exists",
          variant: "destructive"
        });
        return;
      }

      // Convert value to the correct type
      let typedValue = newVariable.value;
      if (newVariable.type === 'number') {
        const num = Number(newVariable.value);
        if (isNaN(num)) {
          toast({
            title: "Invalid number",
            description: "Please enter a valid number",
            variant: "destructive"
          });
          return;
        }
        typedValue = num;
      } else if (newVariable.type === 'boolean') {
        typedValue = newVariable.value === 'true';
      }

      const varId = `var-${Date.now()}`;
      await addGlobalVariable(varId, {
        ...newVariable,
        value: typedValue
      });

      setIsAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "Variable added",
        description: `"${newVariable.name}" has been added successfully`,
      });
    } catch (error) {
      console.error('Error adding variable:', error);
      toast({
        title: "Error",
        description: "Failed to add variable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVariable = async () => {
    try {
      setIsLoading(true);
      
      if (!editingVariable || !editingVariable.id) return;
      
      if (!editingVariable.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for the variable",
          variant: "destructive"
        });
        return;
      }

      // Check if variable name already exists (excluding the current variable)
      if (globalVariables.some(v => v.name === editingVariable.name && v.id !== editingVariable.id)) {
        toast({
          title: "Duplicate name",
          description: "A variable with this name already exists",
          variant: "destructive"
        });
        return;
      }

      // Convert value to the correct type
      let typedValue = editingVariable.value;
      if (editingVariable.type === 'number') {
        const num = Number(editingVariable.value);
        if (isNaN(num)) {
          toast({
            title: "Invalid number",
            description: "Please enter a valid number",
            variant: "destructive"
          });
          return;
        }
        typedValue = num;
      } else if (editingVariable.type === 'boolean') {
        typedValue = editingVariable.value === 'true';
      }

      await updateGlobalVariable(editingVariable.id, {
        name: editingVariable.name,
        value: typedValue,
        type: editingVariable.type,
        description: editingVariable.description
      });

      setIsEditDialogOpen(false);
      resetForm();
      
      toast({
        title: "Variable updated",
        description: `"${editingVariable.name}" has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating variable:', error);
      toast({
        title: "Error",
        description: "Failed to update variable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariable = async (variable: GlobalVariable) => {
    try {
      setIsLoading(true);
      
      await deleteGlobalVariable(variable.id);
      
      toast({
        title: "Variable deleted",
        description: `"${variable.name}" has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast({
        title: "Error",
        description: "Failed to delete variable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (variable: GlobalVariable) => {
    if (variable.type === 'boolean') {
      return variable.value ? 'true' : 'false';
    }
    return String(variable.value);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Global Variables Manager</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Manage global variables that can be used across all payroll flows
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Variable
            </Button>
          </div>
          
          {globalVariables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No global variables defined yet</p>
              <p className="text-sm">Add a variable to get started</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-[1fr,1fr,100px,auto] gap-4 p-3 bg-muted text-sm font-medium">
                <div>Name</div>
                <div>Value</div>
                <div>Type</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y">
                {globalVariables.map(variable => (
                  <div key={variable.id} className="grid grid-cols-[1fr,1fr,100px,auto] gap-4 p-3 items-center">
                    <div>
                      <div className="font-medium">{variable.name}</div>
                      {variable.description && (
                        <div className="text-xs text-muted-foreground">{variable.description}</div>
                      )}
                    </div>
                    <div className="font-mono text-sm">{formatValue(variable)}</div>
                    <div className="text-sm">{variable.type}</div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setEditingVariable(variable);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => handleDeleteVariable(variable)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Variable Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Global Variable</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="var-name">Variable Name</Label>
              <Input 
                id="var-name" 
                value={newVariable.name} 
                onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                placeholder="e.g. taxRate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-type">Type</Label>
              <Select 
                value={newVariable.type} 
                onValueChange={(value: 'string' | 'number' | 'boolean') => setNewVariable({...newVariable, type: value})}
              >
                <SelectTrigger id="var-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-value">Value</Label>
              {newVariable.type === 'boolean' ? (
                <Select 
                  value={newVariable.value} 
                  onValueChange={(value: 'true' | 'false') => setNewVariable({...newVariable, value: value})}
                >
                  <SelectTrigger id="var-value">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  id="var-value" 
                  value={newVariable.value} 
                  onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                  placeholder={newVariable.type === 'number' ? "e.g. 0.25" : "e.g. USD"}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-description">Description (optional)</Label>
              <Textarea 
                id="var-description" 
                value={newVariable.description} 
                onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                placeholder="Describe what this variable is used for"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddVariable} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Variable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variable Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Global Variable</DialogTitle>
          </DialogHeader>
          
          {editingVariable && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-var-name">Variable Name</Label>
                <Input 
                  id="edit-var-name" 
                  value={editingVariable.name} 
                  onChange={(e) => setEditingVariable({...editingVariable, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-var-type">Type</Label>
                <Select 
                  value={editingVariable.type} 
                  onValueChange={(value: 'string' | 'number' | 'boolean') => setEditingVariable({...editingVariable, type: value})}
                >
                  <SelectTrigger id="edit-var-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-var-value">Value</Label>
                {editingVariable.type === 'boolean' ? (
                  <Select 
                    value={String(editingVariable.value)} 
                    onValueChange={(value: 'true' | 'false') => setEditingVariable({...editingVariable, value: value})}
                  >
                    <SelectTrigger id="edit-var-value">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id="edit-var-value" 
                    value={String(editingVariable.value)} 
                    onChange={(e) => setEditingVariable({...editingVariable, value: e.target.value})}
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-var-description">Description (optional)</Label>
                <Textarea 
                  id="edit-var-description" 
                  value={editingVariable.description} 
                  onChange={(e) => setEditingVariable({...editingVariable, description: e.target.value})}
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditVariable} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalVariablesManager;
