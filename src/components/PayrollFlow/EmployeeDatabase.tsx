import React, { useState, useEffect } from 'react';
import { Employee } from '@/data/employeeData';
import { GlobalVariable } from '@/types/database';
import { Flow } from '@/types/database';
import { 
  addEmployee, 
  getAllEmployees, 
  updateEmployee, 
  deleteEmployee,
  employeesRef,
  getAllFlows,
  flowsRef,
  linkFlowToEmployee,
  unlinkFlowFromEmployee,
  bulkLinkFlowToEmployees
} from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash, 
  Database, 
  Variable, 
  Link, 
  GitBranch, 
  Info, 
  User,
  FileSymlink 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface EmployeeDatabaseProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  globalVariables: GlobalVariable[];
  setGlobalVariables: React.Dispatch<React.SetStateAction<GlobalVariable[]>>;
  nodes?: any[];
  edges?: any[];
  onShowFlow?: (employeeId: string, fieldName: string) => void;
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
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [isBulkLinkDialogOpen, setIsBulkLinkDialogOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkSelectedFieldName, setBulkSelectedFieldName] = useState<string>('');
  const [bulkSelectedFlowId, setBulkSelectedFlowId] = useState<string>('');

  // Load employees from Firestore and set up real-time sync
  useEffect(() => {
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(employeesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setEmployees]);

  // Load flows from Firestore and set up real-time sync
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

  // Handle employee creation
  const handleCreateEmployee = async (employee: Employee) => {
    try {
      await addEmployee(employee.id, employee);
      setIsEmployeeDialogOpen(false);
      setCurrentEmployee(null);
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  // Handle employee update
  const handleUpdateEmployee = async (employeeId: string, data: Partial<Employee>) => {
    try {
      await updateEmployee(employeeId, data);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  // Handle employee deletion
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Add field to employee
  const addEmployeeField = async (employeeId: string, key: string, value: any) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      await handleUpdateEmployee(employeeId, { [key]: value });
    }
  };

  // Remove field from employee
  const removeEmployeeField = async (employeeId: string, key: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      await handleUpdateEmployee(employeeId, { [key]: null });
    }
  };

  // Add field to all employees
  const addBulkField = async (key: string, value: any) => {
    const updates = employees.map(async (employee) => {
      await handleUpdateEmployee(employee.id, { [key]: value });
    });
    await Promise.all(updates);
  };

  // Handle employee submit
  const handleEmployeeSubmit = async () => {
    if (!currentEmployee) return;
    
    if (currentEmployee.id) {
      await handleUpdateEmployee(currentEmployee.id, currentEmployee);
    } else {
      const newEmployee = {
        ...currentEmployee,
        id: `emp-${Date.now()}`,
        fields: currentEmployee.fields || {}
      };
      await handleCreateEmployee(newEmployee);
    }
    
    setIsEmployeeDialogOpen(false);
    setCurrentEmployee(null);
  };

  // Add field to current employee
  const addFieldToEmployee = async () => {
    if (!currentEmployee || !newFieldKey) return;
    
    const updatedEmployee = {
      ...currentEmployee,
      fields: {
        ...currentEmployee.fields,
        [newFieldKey]: newFieldValue
      }
    };
    
    setCurrentEmployee(updatedEmployee);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  // Handle bulk field addition
  const handleAddFieldToAllEmployees = async () => {
    if (!bulkFieldKey) return;
    await addBulkField(bulkFieldKey, bulkFieldValue);
    setBulkFieldKey('');
    setBulkFieldValue('');
    setIsBulkFieldDialogOpen(false);
  };

  // Check for connected flows
  const hasConnectedFlow = (employeeId: string, fieldName?: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !employee.linkedFlows) return false;
    
    if (fieldName) {
      return employee.linkedFlows[fieldName] !== undefined;
    }
    
    return Object.keys(employee.linkedFlows || {}).length > 0;
  };

  // Get flow name by ID
  const getFlowNameById = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    return flow ? flow.name : 'Unknown Flow';
  };

  // Get linked flow for employee field
  const getLinkedFlowForField = (employeeId: string, fieldName: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !employee.linkedFlows) return null;
    
    return employee.linkedFlows[fieldName] as string;
  };

  // Get all general flows linked to an employee
  const getEmployeeGeneralFlows = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !employee.linkedFlows || !employee.linkedFlows._flows) return [];
    
    return employee.linkedFlows._flows as string[];
  };

  // Handle linking flow to employee
  const handleLinkFlowToEmployee = async () => {
    if (!selectedEmployeeId || !selectedFlowId) return;
    
    try {
      await linkFlowToEmployee(selectedEmployeeId, selectedFlowId, selectedFieldName || undefined);
      toast({
        title: "Flow linked successfully",
        description: `Flow has been linked to ${selectedFieldName ? `field "${selectedFieldName}"` : 'employee'}.`,
      });
      setIsFlowsDialogOpen(false);
    } catch (error) {
      console.error('Error linking flow:', error);
      toast({
        title: "Error linking flow",
        description: "An error occurred while linking the flow.",
        variant: "destructive"
      });
    }
  };

  // Handle unlinking flow from employee
  const handleUnlinkFlowFromEmployee = async (employeeId: string, fieldName?: string) => {
    try {
      await unlinkFlowFromEmployee(employeeId, fieldName);
      toast({
        title: "Flow unlinked successfully",
        description: `Flow has been unlinked from ${fieldName ? `field "${fieldName}"` : 'employee'}.`,
      });
    } catch (error) {
      console.error('Error unlinking flow:', error);
      toast({
        title: "Error unlinking flow",
        description: "An error occurred while unlinking the flow.",
        variant: "destructive"
      });
    }
  };

  // Handle bulk linking flow to employees
  const handleBulkLinkFlowToEmployees = async () => {
    if (selectedEmployeeIds.length === 0 || !bulkSelectedFlowId) return;
    
    try {
      await bulkLinkFlowToEmployees(selectedEmployeeIds, bulkSelectedFlowId, bulkSelectedFieldName || undefined);
      toast({
        title: "Flow linked to multiple employees",
        description: `Flow has been linked to ${selectedEmployeeIds.length} employees.`,
      });
      setIsBulkLinkDialogOpen(false);
      setSelectedEmployeeIds([]);
      setBulkSelectedFieldName('');
      setBulkSelectedFlowId('');
    } catch (error) {
      console.error('Error bulk linking flow:', error);
      toast({
        title: "Error linking flow",
        description: "An error occurred while linking the flow to employees.",
        variant: "destructive"
      });
    }
  };

  // Toggle employee selection for bulk operations
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Employee Database
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <Button onClick={() => { 
                  setCurrentEmployee({ id: '', name: '', position: '', fields: {} }); 
                  setIsEmployeeDialogOpen(true); 
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
                <Button onClick={() => setIsBulkFieldDialogOpen(true)}>
                  <Variable className="h-4 w-4 mr-2" />
                  Add Bulk Field
                </Button>
                <Button onClick={() => setIsBulkLinkDialogOpen(true)}>
                  <FileSymlink className="h-4 w-4 mr-2" />
                  Bulk Link Flow
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {isBulkLinkDialogOpen && <TableHead className="w-12">Select</TableHead>}
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                {isBulkLinkDialogOpen && (
                  <TableCell>
                    <Checkbox 
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                    />
                  </TableCell>
                )}
                <TableCell>{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(employee.fields || {})
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .map(([key, value]) => {
                      const linkedFlowId = getLinkedFlowForField(employee.id, key);
                      const isLinked = !!linkedFlowId;
                      const flowName = isLinked ? getFlowNameById(linkedFlowId) : '';
                      
                      return (
                        <TooltipProvider key={key}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 
                                  ${isLinked 
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' 
                                    : 'bg-gray-100'}`}
                                onClick={() => {
                                  if (isLinked && onShowFlow) {
                                    onShowFlow(employee.id, key);
                                  } else {
                                    setSelectedEmployeeId(employee.id);
                                    setSelectedFieldName(key);
                                    setSelectedFlowId('');
                                    setIsFlowsDialogOpen(true);
                                  }
                                }}
                              >
                                {isLinked && 
                                  <Link className="h-3.5 w-3.5 text-blue-600" />
                                }
                                <span className="font-medium">{key}:</span> 
                                {value.toString()}
                                {isLinked && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {flowName}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isLinked 
                                ? `Linked to flow: ${flowName}` 
                                : "Click to link a flow"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCurrentEmployee(employee);
                        setIsEmployeeDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedEmployeeId(employee.id);
                        setSelectedFieldName(null);
                        setSelectedFlowId('');
                        setIsFlowsDialogOpen(true);
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Display linked general flows */}
                  {getEmployeeGeneralFlows(employee.id).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">Linked Flows:</div>
                      <div className="flex flex-wrap gap-1">
                        {getEmployeeGeneralFlows(employee.id).map(flowId => (
                          <Badge 
                            key={flowId} 
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <GitBranch className="h-3 w-3" />
                            {getFlowNameById(flowId)}
                            <button 
                              className="ml-1 text-gray-500 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlinkFlowFromEmployee(employee.id, flowId);
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Employee Dialog */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentEmployee?.id ? 'Edit Employee' : 'Add Employee'}
            </DialogTitle>
          </DialogHeader>
          {currentEmployee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name"
                  value={currentEmployee.name}
                  onChange={(e) => setCurrentEmployee({
                    ...currentEmployee,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position"
                  value={currentEmployee.position}
                  onChange={(e) => setCurrentEmployee({
                    ...currentEmployee,
                    position: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Fields</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(currentEmployee.fields || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 p-2 rounded">
                        <span className="font-medium">{key}:</span> {value.toString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fields = { ...currentEmployee.fields };
                          delete fields[key];
                          setCurrentEmployee({ ...currentEmployee, fields });
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
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
                    <Button onClick={addFieldToEmployee}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmployeeSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Field Dialog */}
      <Dialog open={isBulkFieldDialogOpen} onOpenChange={setIsBulkFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Field to All Employees</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkFieldKey">Field Name</Label>
              <Input
                id="bulkFieldKey"
                value={bulkFieldKey}
                onChange={(e) => setBulkFieldKey(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bulkFieldValue">Value</Label>
              <Input
                id="bulkFieldValue"
                value={bulkFieldValue}
                onChange={(e) => setBulkFieldValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFieldToAllEmployees}>Add to All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flow Linking Dialog */}
      <Dialog open={isFlowsDialogOpen} onOpenChange={setIsFlowsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFieldName 
                ? `Link Flow to Field "${selectedFieldName}"` 
                : `Link Flows to Employee`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flow-select">Select Flow</Label>
              <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                <SelectTrigger id="flow-select">
                  <SelectValue placeholder="Select a flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!selectedFieldName && (
              <div className="pt-2">
                <div className="font-medium text-sm mb-2">Currently Linked Flows</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {getEmployeeGeneralFlows(selectedEmployeeId || '').length > 0 ? (
                    getEmployeeGeneralFlows(selectedEmployeeId || '').map(flowId => (
                      <Badge 
                        key={flowId} 
                        variant="secondary"
                        className="flex items-center gap-1 py-1.5"
                      >
                        <GitBranch className="h-3 w-3" />
                        {getFlowNameById(flowId)}
                        <button 
                          className="ml-1 text-gray-500 hover:text-red-500"
                          onClick={() => handleUnlinkFlowFromEmployee(selectedEmployeeId || '', flowId)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No flows linked to this employee</div>
                  )}
                </div>
              </div>
            )}
            
            {selectedFieldName && getLinkedFlowForField(selectedEmployeeId || '', selectedFieldName) && (
              <Button 
                variant="destructive"
                onClick={() => {
                  handleUnlinkFlowFromEmployee(selectedEmployeeId || '', selectedFieldName);
                  setIsFlowsDialogOpen(false);
                }}
              >
                Unlink Current Flow
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={handleLinkFlowToEmployee} disabled={!selectedFlowId}>
              {selectedFieldName ? 'Link Flow to Field' : 'Add Flow to Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Link Flow Dialog */}
      <Dialog open={isBulkLinkDialogOpen} onOpenChange={setIsBulkLinkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Link Flow to Employees</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-flow-select">Select Flow</Label>
              <Select value={bulkSelectedFlowId} onValueChange={setBulkSelectedFlowId}>
                <SelectTrigger id="bulk-flow-select">
                  <SelectValue placeholder="Select a flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-field-name">Field Name (Optional)</Label>
              <Input
                id="bulk-field-name"
                value={bulkSelectedFieldName}
                onChange={(e) => setBulkSelectedFieldName(e.target.value)}
                placeholder="Leave empty to link to employee"
              />
            </div>
            
            <div className="border rounded-md p-2">
              <div className="font-medium mb-2">Select Employees</div>
              <div className="flex gap-2 mb-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedEmployeeIds(employees.map(e => e.id))}
                >
                  Select All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedEmployeeIds([])}
                >
                  Deselect All
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2 py-1">
                    <Checkbox 
                      id={`employee-${employee.id}`} 
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                    />
                    <Label htmlFor={`employee-${employee.id}`} className="cursor-pointer">
                      {employee.name} ({employee.position})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleBulkLinkFlowToEmployees} 
              disabled={selectedEmployeeIds.length === 0 || !bulkSelectedFlowId}
            >
              Link Flow to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmployeeDatabase;
