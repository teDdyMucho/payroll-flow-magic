import React, { useState, useEffect } from 'react';
import { sampleEmployees, Employee } from '@/data/employeeData';
import { GlobalVariable, initialGlobalVariables } from '@/data/globalVariables';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash, 
  Database, 
  Variable, 
  FileCheck, 
  Link, 
  Users, 
  FileBarChart2, 
  Info, 
  User, 
  GitBranch 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edge, Node } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';

interface EmployeeDatabaseProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  globalVariables: GlobalVariable[];
  setGlobalVariables: React.Dispatch<React.SetStateAction<GlobalVariable[]>>;
  nodes?: any[];
  edges?: Edge[];
  onShowFlow?: (employeeId: string, fieldName: string) => void;
}

interface ConnectedFlow {
  id: string;
  name: string;
  nodeId: string;
}

interface SavedFlow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeDatabase: React.FC<EmployeeDatabaseProps> = ({ 
  employees, 
  setEmployees,
  globalVariables,
  setGlobalVariables,
  nodes = [],
  edges = [],
  onShowFlow
}) => {
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isBulkFieldDialogOpen, setIsBulkFieldDialogOpen] = useState(false);
  const [bulkFieldKey, setBulkFieldKey] = useState('');
  const [bulkFieldValue, setBulkFieldValue] = useState('');
  const [isFlowsDialogOpen, setIsFlowsDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Flow assignment state
  const [isAssignFlowDialogOpen, setIsAssignFlowDialogOpen] = useState(false);
  const [isBulkAssignFlowDialogOpen, setIsBulkAssignFlowDialogOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [availableFlows, setAvailableFlows] = useState<SavedFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');

  // Check if field has connected flows
  const hasConnectedFlow = (employeeId: string, fieldName?: string) => {
    // Find output nodes that are connected to this employee
    const outputNodes = nodes.filter(node => 
      node.type === 'outputNode' && 
      node.data?.connectedEmployeeId === employeeId
    );
    
    if (fieldName) {
      // If fieldName is provided, check if any output node is connected to this specific field
      return outputNodes.some(node => node.data?.selectedField === fieldName);
    }
    
    return outputNodes.length > 0;
  };

  // Get connected flows for an employee
  const getConnectedFlows = (employeeId: string): ConnectedFlow[] => {
    // Find output nodes connected to this employee
    const outputNodes = nodes.filter(node => 
      node.type === 'outputNode' && 
      node.data?.connectedEmployeeId === employeeId
    );
    
    // Map to flow information
    return outputNodes.map(node => ({
      id: node.id,
      name: node.data?.outputName || 'Unnamed Flow',
      nodeId: node.id
    }));
  };

  // Handle click on field to show flow
  const handleFieldClick = (employeeId: string, fieldName: string) => {
    if (onShowFlow && hasConnectedFlow(employeeId, fieldName)) {
      onShowFlow(employeeId, fieldName);
    }
  };

  // Handle employee edit/create
  const handleEmployeeSubmit = () => {
    if (!currentEmployee) return;
    
    if (currentEmployee.id) {
      // Edit existing employee
      setEmployees(employees.map(emp => 
        emp.id === currentEmployee.id ? currentEmployee : emp
      ));
    } else {
      // Create new employee
      const newEmployee = {
        ...currentEmployee,
        id: `emp-${Date.now()}`
      };
      setEmployees([...employees, newEmployee]);
    }
    
    setIsEmployeeDialogOpen(false);
    setCurrentEmployee(null);
  };
  
  // Add a field to the current employee
  const addFieldToEmployee = () => {
    if (!currentEmployee || !newFieldKey) return;
    
    setCurrentEmployee({
      ...currentEmployee,
      fields: {
        ...currentEmployee.fields,
        [newFieldKey]: newFieldValue
      }
    });
    
    setNewFieldKey('');
    setNewFieldValue('');
  };
  
  // Remove a field from the current employee
  const removeFieldFromEmployee = (key: string) => {
    if (!currentEmployee) return;
    
    const updatedFields = { ...currentEmployee.fields };
    delete updatedFields[key];
    
    setCurrentEmployee({
      ...currentEmployee,
      fields: updatedFields
    });
  };

  // Delete employee
  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  // Add field to all employees
  const handleAddFieldToAllEmployees = () => {
    if (!bulkFieldKey) return;
    
    const updatedEmployees = employees.map(employee => ({
      ...employee,
      fields: {
        ...employee.fields,
        [bulkFieldKey]: bulkFieldValue
      }
    }));
    
    setEmployees(updatedEmployees);
    setBulkFieldKey('');
    setBulkFieldValue('');
    setIsBulkFieldDialogOpen(false);
  };

  // Show connected flows for an employee
  const handleShowConnectedFlows = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsFlowsDialogOpen(true);
  };

  // Get the selected employee
  const getSelectedEmployee = () => {
    if (!selectedEmployeeId) return null;
    return employees.find(emp => emp.id === selectedEmployeeId) || null;
  };

  // Load available flows from localStorage
  const loadAvailableFlows = () => {
    const savedFlows = localStorage.getItem('payrollFlows');
    const flows = savedFlows ? JSON.parse(savedFlows) : [];
    setAvailableFlows(flows);
    if (flows.length > 0) {
      setSelectedFlowId(flows[0].id);
    }
  };

  // Open assign flow dialog for a single employee
  const handleOpenAssignFlowDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeIds([employeeId]);
    loadAvailableFlows();
    setIsAssignFlowDialogOpen(true);
  };

  // Open bulk assign flow dialog
  const handleOpenBulkAssignFlowDialog = () => {
    setSelectedEmployeeIds(employees.map(emp => emp.id));
    loadAvailableFlows();
    setIsBulkAssignFlowDialogOpen(true);
  };

  // Assign a flow to an employee
  const assignFlowToEmployee = (employeeId: string, flowId: string) => {
    // Find the flow
    const flow = availableFlows.find(f => f.id === flowId);
    if (!flow) return;

    // Update the employee with the assigned flow
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        // Create or update the assignedFlows array
        const currentAssignedFlows = emp.assignedFlows || [];
        
        // Check if flow is already assigned
        const flowIndex = currentAssignedFlows.findIndex(f => f.id === flowId);
        
        if (flowIndex >= 0) {
          // Flow already assigned, update it
          const updatedFlows = [...currentAssignedFlows];
          updatedFlows[flowIndex] = {
            id: flow.id,
            name: flow.name,
            assignedAt: new Date()
          };
          return {
            ...emp,
            assignedFlows: updatedFlows
          };
        } else {
          // Flow not assigned yet, add it
          return {
            ...emp,
            assignedFlows: [
              ...currentAssignedFlows,
              {
                id: flow.id,
                name: flow.name,
                assignedAt: new Date()
              }
            ]
          };
        }
      }
      return emp;
    });

    setEmployees(updatedEmployees);
  };

  // Bulk assign a flow to multiple employees
  const bulkAssignFlowToEmployees = (employeeIds: string[], flowId: string) => {
    // Find the flow
    const flow = availableFlows.find(f => f.id === flowId);
    if (!flow) return;

    // Update all selected employees with the assigned flow
    const updatedEmployees = employees.map(emp => {
      if (employeeIds.includes(emp.id)) {
        // Create or update the assignedFlows array
        const currentAssignedFlows = emp.assignedFlows || [];
        
        // Check if flow is already assigned
        const flowIndex = currentAssignedFlows.findIndex(f => f.id === flowId);
        
        if (flowIndex >= 0) {
          // Flow already assigned, update it
          const updatedFlows = [...currentAssignedFlows];
          updatedFlows[flowIndex] = {
            id: flow.id,
            name: flow.name,
            assignedAt: new Date()
          };
          return {
            ...emp,
            assignedFlows: updatedFlows
          };
        } else {
          // Flow not assigned yet, add it
          return {
            ...emp,
            assignedFlows: [
              ...currentAssignedFlows,
              {
                id: flow.id,
                name: flow.name,
                assignedAt: new Date()
              }
            ]
          };
        }
      }
      return emp;
    });

    setEmployees(updatedEmployees);
  };

  // Handle single flow assignment
  const handleAssignFlow = () => {
    if (!selectedEmployeeId || !selectedFlowId) return;
    assignFlowToEmployee(selectedEmployeeId, selectedFlowId);
    setIsAssignFlowDialogOpen(false);
  };

  // Handle bulk flow assignment
  const handleBulkAssignFlow = () => {
    if (selectedEmployeeIds.length === 0 || !selectedFlowId) return;
    bulkAssignFlowToEmployees(selectedEmployeeIds, selectedFlowId);
    setIsBulkAssignFlowDialogOpen(false);
  };

  // Get assigned flows for an employee
  const getAssignedFlows = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.assignedFlows || [];
  };

  // Remove a flow assignment from an employee
  const removeFlowAssignment = (employeeId: string, flowId: string) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId && emp.assignedFlows) {
        return {
          ...emp,
          assignedFlows: emp.assignedFlows.filter(f => f.id !== flowId)
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
  };

  return (
    <div className="h-full p-4 overflow-auto bg-white scrollbar-visible">
      <h2 className="text-xl font-bold mb-4">Employee Database</h2>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setCurrentEmployee({ id: '', name: '', position: '', fields: {} });
              setIsEmployeeDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setIsBulkFieldDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" /> Add Field to All
          </Button>
          <Button 
            variant="outline"
            onClick={handleOpenBulkAssignFlowDialog}
            className="flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" /> Bulk Assign Flow
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Connected Flows</TableHead>
                <TableHead>Assigned Flows</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(employee.fields).map(([key, value]) => {
                        const isConnected = hasConnectedFlow(employee.id, key);
                        return (
                          <TooltipProvider key={key}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  key={key} 
                                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5
                                    ${isConnected 
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer border border-blue-300 shadow-sm transition-all transform hover:scale-105' 
                                      : 'bg-gray-100 hover:bg-gray-200 transition-colors'}`
                                  }
                                  onClick={() => handleFieldClick(employee.id, key)}
                                >
                                  {isConnected && <Link className="h-3.5 w-3.5 text-blue-600" />}
                                  <span className="font-medium">{key}:</span> {value.toString()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isConnected 
                                  ? "This field is connected to a flow. Click to view." 
                                  : "This field is not connected to any flow."}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasConnectedFlow(employee.id) ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1.5 text-blue-600"
                        onClick={() => handleShowConnectedFlows(employee.id)}
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                        <Badge variant="outline" className="rounded-full">
                          {getConnectedFlows(employee.id).length}
                        </Badge>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500">No flows</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getAssignedFlows(employee.id).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {getAssignedFlows(employee.id).map(flow => (
                          <Badge key={flow.id} variant="secondary" className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {flow.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setCurrentEmployee(employee);
                          setIsEmployeeDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => deleteEmployee(employee.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleOpenAssignFlowDialog(employee.id)}
                      >
                        <GitBranch className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentEmployee?.id ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          {currentEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={currentEmployee.name} 
                  onChange={(e) => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  value={currentEmployee.position} 
                  onChange={(e) => setCurrentEmployee({...currentEmployee, position: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fields</Label>
                <div className="border rounded-md p-3 space-y-3">
                  {Object.entries(currentEmployee.fields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1 flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <div>
                          <span className="font-semibold">{key}:</span> {value.toString()}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFieldFromEmployee(key)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Field name" 
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                    />
                    <Input 
                      placeholder="Value" 
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={addFieldToEmployee}
                      disabled={!newFieldKey}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEmployeeSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Field Dialog */}
      <Dialog open={isBulkFieldDialogOpen} onOpenChange={setIsBulkFieldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Field to All Employees</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkFieldKey">Field Name</Label>
              <Input 
                id="bulkFieldKey" 
                value={bulkFieldKey} 
                onChange={(e) => setBulkFieldKey(e.target.value)}
                placeholder="e.g., bonusRate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkFieldValue">Field Value</Label>
              <Input 
                id="bulkFieldValue" 
                value={bulkFieldValue} 
                onChange={(e) => setBulkFieldValue(e.target.value)}
                placeholder="e.g., 0.05"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
              <p className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                This will add the field to all {employees.length} employees.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkFieldDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFieldToAllEmployees} disabled={!bulkFieldKey}>Add to All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connected Flows Dialog */}
      <Dialog open={isFlowsDialogOpen} onOpenChange={setIsFlowsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connected Flows</DialogTitle>
          </DialogHeader>
          {selectedEmployeeId && getSelectedEmployee() && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{getSelectedEmployee()?.name}</p>
                  <p className="text-sm text-gray-600">{getSelectedEmployee()?.position}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Connected Flows:</h3>
                {getConnectedFlows(selectedEmployeeId).length > 0 ? (
                  <div className="space-y-2">
                    {getConnectedFlows(selectedEmployeeId).map(flow => (
                      <div key={flow.id} className="p-3 border rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{flow.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (onShowFlow) {
                              onShowFlow(selectedEmployeeId, '');
                              setIsFlowsDialogOpen(false);
                            }
                          }}
                        >
                          View Flow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No flows connected to this employee</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsFlowsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Flow Dialog */}
      <Dialog open={isAssignFlowDialogOpen} onOpenChange={setIsAssignFlowDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Flow</DialogTitle>
          </DialogHeader>
          {selectedEmployeeId && getSelectedEmployee() && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{getSelectedEmployee()?.name}</p>
                  <p className="text-sm text-gray-600">{getSelectedEmployee()?.position}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Current Assigned Flows:</Label>
                {getAssignedFlows(selectedEmployeeId).length > 0 ? (
                  <div className="space-y-2">
                    {getAssignedFlows(selectedEmployeeId).map(flow => (
                      <div key={flow.id} className="p-3 border rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{flow.name}</span>
                          <span className="text-xs text-gray-500">
                            Assigned: {new Date(flow.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeFlowAssignment(selectedEmployeeId, flow.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500 border rounded-md p-3">
                    <p>No flows assigned yet</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Available Flows:</Label>
                {availableFlows.length > 0 ? (
                  <div className="space-y-2">
                    {availableFlows.map(flow => (
                      <div 
                        key={flow.id} 
                        className={`p-3 border rounded-md flex justify-between items-center ${
                          selectedFlowId === flow.id ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{flow.name}</span>
                        </div>
                        <Button 
                          variant={selectedFlowId === flow.id ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedFlowId(flow.id)}
                        >
                          {selectedFlowId === flow.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No available flows</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFlowDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignFlow} disabled={!selectedFlowId}>Assign Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Flow Dialog */}
      <Dialog open={isBulkAssignFlowDialogOpen} onOpenChange={setIsBulkAssignFlowDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Assign Flow</DialogTitle>
          </DialogHeader>
          {selectedEmployeeIds.length > 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Bulk Assignment</p>
                    <p className="text-sm text-gray-600">
                      This will assign the selected flow to {selectedEmployeeIds.length} employees.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Available Flows:</Label>
                {availableFlows.length > 0 ? (
                  <div className="space-y-2">
                    {availableFlows.map(flow => (
                      <div 
                        key={flow.id} 
                        className={`p-3 border rounded-md flex justify-between items-center ${
                          selectedFlowId === flow.id ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{flow.name}</span>
                        </div>
                        <Button 
                          variant={selectedFlowId === flow.id ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedFlowId(flow.id)}
                        >
                          {selectedFlowId === flow.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No available flows</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAssignFlowDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAssignFlow} disabled={!selectedFlowId}>Bulk Assign Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDatabase;
