import React, { useState, useEffect } from 'react';
import { Employee } from '@/data/employeeData';
import { GlobalVariable } from '@/data/globalVariables';
import { 
  addEmployee, 
  getAllEmployees, 
  updateEmployee, 
  deleteEmployee,
  employeesRef 
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
  User 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [isLoading, setIsLoading] = useState(true);

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
    const outputNodes = nodes.filter(node => 
      node.type === 'outputNode' && 
      node.data?.connectedEmployeeId === employeeId
    );
    
    if (fieldName) {
      return outputNodes.some(node => node.data?.selectedField === fieldName);
    }
    
    return outputNodes.length > 0;
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
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell>{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(employee.fields || {}).map(([key, value]) => (
                      <TooltipProvider key={key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 
                              ${hasConnectedFlow(employee.id, key) 
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' 
                                : 'bg-gray-100'}`}>
                              {hasConnectedFlow(employee.id, key) && 
                                <Link className="h-3.5 w-3.5 text-blue-600" />
                              }
                              <span className="font-medium">{key}:</span> 
                              {value.toString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasConnectedFlow(employee.id, key) 
                              ? "Connected to flow" 
                              : "No flow connected"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
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
                  </div>
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
    </Card>
  );
};

export default EmployeeDatabase;
