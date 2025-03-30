import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Search, AlertCircle } from 'lucide-react';
import { Employee } from '@/data/employeeData';
import { toast } from "@/components/ui/use-toast";

interface EmployeeNodeProps {
  
  id: string;
  data: {
    label: string;
    employeeId: string;
    employees: Employee[];
    searchTerm?: string;
    onEmployeeChange: (id: string, employeeId: string) => void;
    onSearchTermChange?: (id: string, searchTerm: string) => void;
  };
  selected: boolean;
}

const EmployeeNode: React.FC<EmployeeNodeProps> = ({ id, data, selected }) => {
  const [employeeId, setEmployeeId] = useState(data.employeeId || '');
  const [searchTerm, setSearchTerm] = useState(data.searchTerm || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setEmployeeId(data.employeeId || '');
    if (data.searchTerm !== undefined) {
      setSearchTerm(data.searchTerm);
    }
  }, [data.employeeId, data.searchTerm]);
  
  // Get the selected employee
  const selectedEmployee = data.employees.find(emp => emp.id === employeeId);
  
  // Filter employees based on search term
  const filteredEmployees = searchTerm 
    ? data.employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data.employees;
  
  // Handle employee selection change
  const handleEmployeeChange = (value: string) => {
    try {
      setIsLoading(true);
      setEmployeeId(value);
      data.onEmployeeChange(id, value);
      
      // Show toast notification
      const employee = data.employees.find(emp => emp.id === value);
      if (employee) {
        toast({
          title: "Employee Selected",
          description: `${employee.name}'s fields are now available as variables`,
        });
      }
    } catch (error) {
      console.error("Error changing employee:", error);
      toast({
        title: "Error",
        description: "Failed to select employee. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Select first employee if none is selected
  useEffect(() => {
    if (!employeeId && data.employees.length > 0) {
      handleEmployeeChange(data.employees[0].id);
    }
  }, [data.employees]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (data.onSearchTermChange) {
      data.onSearchTermChange(id, e.target.value);
    }
  };

  return (
    <Card className={`w-64 p-4 border-2 ${selected ? 'border-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-2 mb-4">
        <User className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-sm">{data.label || 'Employee Data'}</h3>
      </div>
      
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            className="pl-8 text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`employee-${id}`} className="text-xs">Select Employee</Label>
          <Select 
            value={employeeId} 
            onValueChange={handleEmployeeChange}
            disabled={isLoading}
          >
            <SelectTrigger id={`employee-${id}`} className="w-full">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id} className="flex items-center">
                    <div>
                      <div>{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.position}</div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                  No employees found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployee ? (
          <div className="border rounded-md p-2 bg-gray-50 space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium text-gray-700">Available Fields as Variables</div>
              <Badge variant="outline" className="text-xs">{Object.keys(selectedEmployee.fields).length}</Badge>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {Object.keys(selectedEmployee.fields).map(field => (
                <div key={field} className="flex justify-between items-center py-1 text-xs">
                  <span className="font-medium">{field}:</span>
                  <span className="text-blue-600">{selectedEmployee.fields[field]?.toString() || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border rounded-md p-4 bg-gray-50 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <p className="text-sm text-gray-600">No employee selected</p>
          </div>
        )}
      </div>

      {/* Output handle for employee node */}
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

export default EmployeeNode;
