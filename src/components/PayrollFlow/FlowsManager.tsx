import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Save, FileDown, FilePlus, Trash2, MoreVertical, FileSymlink, FileText } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { 
  addFlow, 
  updateFlow as updateFirestoreFlow, 
  deleteFlow as deleteFirestoreFlow,
  flowsRef
} from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { Flow } from '@/types/database';

interface FlowsManagerProps {
  currentNodes: Node[];
  currentEdges: Edge[];
  onLoadFlow: (nodes: Node[], edges: Edge[]) => void;
}

const FlowsManager: React.FC<FlowsManagerProps> = ({ 
  currentNodes, 
  currentEdges, 
  onLoadFlow 
}) => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Helper function to remove undefined values from an object
  const removeUndefined = (obj: any): any => {
    const result: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    });
    return result;
  };

  // Set up real-time sync with Firestore for flows
  useEffect(() => {
    const unsubscribe = onSnapshot(flowsRef, (snapshot) => {
      const flowsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flow[];
      setFlows(flowsData);
    });

    return () => unsubscribe();
  }, []);

  // Save current flow
  const saveCurrentFlow = async () => {
    try {
      if (!newFlowName.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for your flow",
          variant: "destructive"
        });
        return;
      }

      // Only save essential node properties
      const serializedNodes = currentNodes.map(node => {
        // Extract only the essential properties we need to recreate the node
        const essentialData = {
          label: node.data?.label,
          nodeType: node.data?.nodeType,
          formula: node.data?.formula,
          resultVariable: node.data?.resultVariable,
          variableName: node.data?.variableName,
          outputName: node.data?.outputName,
          description: node.data?.description,
          selectedVariable: node.data?.selectedVariable,
          selectedField: node.data?.selectedField,
          condition: node.data?.condition,
          truePath: node.data?.truePath,
          falsePath: node.data?.falsePath,
          code: node.data?.code,
          outputVariable: node.data?.outputVariable,
        };

        // Remove any undefined values
        const cleanData = removeUndefined(essentialData);

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: cleanData
        };
      });

      const flowId = `flow-${Date.now()}`;
      await addFlow(flowId, {
        name: newFlowName,
        description: newFlowDescription,
        nodes: serializedNodes,
        edges: currentEdges
      });
      
      setNewFlowName('');
      setNewFlowDescription('');
      setShowSaveDialog(false);
      
      toast({
        title: "Flow saved",
        description: `"${newFlowName}" has been saved successfully`,
      });
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: "Error",
        description: "Failed to save flow",
        variant: "destructive"
      });
    }
  };

  // Update an existing flow
  const updateFlow = async (flowId: string) => {
    try {
      // Only save essential node properties
      const serializedNodes = currentNodes.map(node => {
        // Extract only the essential properties we need to recreate the node
        const essentialData = {
          label: node.data?.label,
          nodeType: node.data?.nodeType,
          formula: node.data?.formula,
          resultVariable: node.data?.resultVariable,
          variableName: node.data?.variableName,
          outputName: node.data?.outputName,
          description: node.data?.description,
          selectedVariable: node.data?.selectedVariable,
          selectedField: node.data?.selectedField,
          condition: node.data?.condition,
          truePath: node.data?.truePath,
          falsePath: node.data?.falsePath,
          code: node.data?.code,
          outputVariable: node.data?.outputVariable,
        };

        // Remove any undefined values
        const cleanData = removeUndefined(essentialData);

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: cleanData
        };
      });

      await updateFirestoreFlow(flowId, {
        nodes: serializedNodes,
        edges: currentEdges
      });
      
      toast({
        title: "Flow updated",
        description: `The flow has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating flow:', error);
      toast({
        title: "Error",
        description: "Failed to update flow",
        variant: "destructive"
      });
    }
  };

  // Load a flow
  const loadFlow = (flow: Flow) => {
    // Restore function references when loading nodes
    const nodesWithFunctions = flow.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onFieldChange: (nodeId: string, field: string) => {},
        onVariableNameChange: (nodeId: string, name: string) => {},
        onEmployeeChange: (nodeId: string, employeeId: string) => {},
        onCustomFieldsChange: (nodeId: string, customFields: any[]) => {},
        onSearchTermChange: (nodeId: string, searchTerm: string) => {},
        onFormulaChange: (nodeId: string, formula: string) => {},
        onResultVariableChange: (nodeId: string, variable: string) => {},
        onOutputNameChange: (nodeId: string, name: string) => {},
        onDescriptionChange: (nodeId: string, description: string) => {},
        onSelectedVariableChange: (nodeId: string, variable: string) => {},
        onSelectedFieldChange: (nodeId: string, field: string) => {},
        onConditionChange: (nodeId: string, condition: string) => {},
        onTruePathChange: (nodeId: string, truePath: string) => {},
        onFalsePathChange: (nodeId: string, falsePath: string) => {},
        onCodeChange: (nodeId: string, code: string) => {},
        onOutputVariableChange: (nodeId: string, outputVariable: string) => {},
        updateVariable: (name: string, value: any) => {},
        setEmployees: (employees: any[]) => {}
      }
    }));

    onLoadFlow(nodesWithFunctions, flow.edges);
    setShowLoadDialog(false);
    
    toast({
      title: "Flow loaded",
      description: `"${flow.name}" has been loaded successfully`,
    });
  };

  // Delete a flow
  const deleteFlow = async (flowId: string) => {
    try {
      const flowToDelete = flows.find(flow => flow.id === flowId);
      if (!flowToDelete) return;
      
      await deleteFirestoreFlow(flowId);
      
      toast({
        title: "Flow deleted",
        description: `"${flowToDelete.name}" has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: "Error",
        description: "Failed to delete flow",
        variant: "destructive"
      });
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-1" 
          onClick={() => {
            if (typeof onLoadFlow === 'function') {
              // Create an empty flow
              onLoadFlow([], []);
            }
          }}
        >
          <FileText className="h-4 w-4" /> New Flow
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-1" 
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="h-4 w-4" /> Save Flow
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-1" 
          onClick={() => setShowLoadDialog(true)}
        >
          <FileDown className="h-4 w-4" /> Load Flow
        </Button>
      </div>

      {/* Save Flow Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Flow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input 
                id="flow-name" 
                value={newFlowName} 
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Enter a name for this flow"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flow-description">Description (optional)</Label>
              <Input 
                id="flow-description" 
                value={newFlowDescription} 
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Enter a description for this flow"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={saveCurrentFlow}>Save Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Flow Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Load Flow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {flows.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No saved flows found
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr,auto,auto] gap-4 font-medium text-sm">
                  <div>Name</div>
                  <div>Last Updated</div>
                  <div>Actions</div>
                </div>
                
                {flows.map(flow => (
                  <div key={flow.id} className="grid grid-cols-[1fr,auto,auto] gap-4 items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{flow.name}</div>
                      {flow.description && (
                        <div className="text-sm text-muted-foreground">{flow.description}</div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {formatDate(flow.updatedAt)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadFlow(flow)}
                        className="flex items-center gap-1"
                      >
                        <FileSymlink className="h-4 w-4" /> Load
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateFlow(flow.id)}>
                            <Save className="h-4 w-4 mr-2" /> Update
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteFlow(flow.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowsManager;
