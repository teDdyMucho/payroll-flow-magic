import React, { useState } from 'react';
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

interface Flow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

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
  const [flows, setFlows] = useState<Flow[]>(() => {
    const savedFlows = localStorage.getItem('payrollFlows');
    return savedFlows ? JSON.parse(savedFlows) : [];
  });
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Save flows to localStorage whenever they change
  const saveFlowsToStorage = (updatedFlows: Flow[]) => {
    localStorage.setItem('payrollFlows', JSON.stringify(updatedFlows));
    setFlows(updatedFlows);
  };

  // Save current flow
  const saveCurrentFlow = () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your flow",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const newFlow: Flow = {
      id: `flow-${Date.now()}`,
      name: newFlowName,
      description: newFlowDescription,
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: now,
      updatedAt: now
    };

    const updatedFlows = [...flows, newFlow];
    saveFlowsToStorage(updatedFlows);
    
    setNewFlowName('');
    setNewFlowDescription('');
    setShowSaveDialog(false);
    
    toast({
      title: "Flow saved",
      description: `"${newFlow.name}" has been saved successfully`,
    });
  };

  // Load a flow
  const loadFlow = (flow: Flow) => {
    onLoadFlow(flow.nodes, flow.edges);
    setShowLoadDialog(false);
    
    toast({
      title: "Flow loaded",
      description: `"${flow.name}" has been loaded successfully`,
    });
  };

  // Update an existing flow
  const updateFlow = (flowId: string) => {
    const now = new Date();
    const updatedFlows = flows.map(flow => 
      flow.id === flowId 
        ? { 
            ...flow, 
            nodes: currentNodes, 
            edges: currentEdges,
            updatedAt: now
          }
        : flow
    );
    
    saveFlowsToStorage(updatedFlows);
    
    toast({
      title: "Flow updated",
      description: `The flow has been updated successfully`,
    });
  };

  // Delete a flow
  const deleteFlow = (flowId: string) => {
    const flowToDelete = flows.find(flow => flow.id === flowId);
    if (!flowToDelete) return;
    
    const updatedFlows = flows.filter(flow => flow.id !== flowId);
    saveFlowsToStorage(updatedFlows);
    
    toast({
      title: "Flow deleted",
      description: `"${flowToDelete.name}" has been deleted`,
    });
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
                placeholder="Describe what this flow does"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveCurrentFlow}>Save Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Flow Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Saved Flows</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {flows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FilePlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No saved flows yet</p>
                <p className="text-sm">Create and save a flow to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {flows.map((flow) => (
                  <div 
                    key={flow.id} 
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{flow.name}</div>
                      {flow.description && (
                        <div className="text-sm text-gray-500">{flow.description}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        Last updated: {formatDate(flow.updatedAt)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => loadFlow(flow)} 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <FileSymlink className="h-3.5 w-3.5" /> Load
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateFlow(flow.id)}>
                            <Save className="h-4 w-4 mr-2" /> Update with current
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
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowsManager;
