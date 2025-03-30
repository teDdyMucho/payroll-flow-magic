import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Grid2X2, 
  List, 
  Plus, 
  Briefcase, 
  Clock, 
  Upload,
  CalendarDays,
  Users,
  BarChart,
  DollarSign,
  CheckCircle2,
  ClockIcon,
  Trash2,
  Pencil
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Event, EventType } from '../TabsNavigation';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  addAttendanceRecord, 
  getAttendanceByDate, 
  updateAttendanceStatus, 
  addTimeRecord, 
  updateTimeRecord,
  getAllEmployees,
  getAttendanceRecord,
  getAllAttendanceRecords,
  deleteAttendanceRecord,
  updateAttendanceRecord
} from '@/lib/firebase';
import { EmployeeAttendance, TimeRecord } from '@/types/attendance';
import { Employee } from '@/types/employee';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CalendarBoardProps {
  events: Event[];
}

// Helper function to get default icon based on event type
const getDefaultIcon = (type: EventType): React.ReactNode => {
  switch (type) {
    case 'payroll':
      return <BarChart className="h-5 w-5" />;
    case 'holiday':
      return <CalendarDays className="h-5 w-5" />;
    case 'meeting':
    case 'vacation':
      return <Users className="h-5 w-5" />;
    default:
      return <Calendar className="h-5 w-5" />;
  }
};

const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

export const CalendarBoard = ({ events }: CalendarBoardProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'list'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [clockInTime, setClockInTime] = useState<string>('09:00');
  const [clockOutTime, setClockOutTime] = useState<string>('17:00');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendance[]>([]);
  const [monthAttendanceRecords, setMonthAttendanceRecords] = useState<EmployeeAttendance[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState('add');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<EmployeeAttendance | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');
  const [editClockInTime, setEditClockInTime] = useState<string>('09:00');
  const [editClockOutTime, setEditClockOutTime] = useState<string>('17:00');
  const [isEditing, setIsEditing] = useState(false);

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeData = await getAllEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error loading employees:', error);
        toast({
          title: "Error loading employees",
          description: "Could not load employee data.",
          variant: "destructive"
        });
      }
    };
    
    loadEmployees();
  }, []);

  // Load all attendance records for the current month when the month changes
  useEffect(() => {
    loadMonthAttendanceRecords();
  }, [currentDate]);

  // Load attendance records when selected day changes
  useEffect(() => {
    if (selectedDay) {
      loadAttendanceRecords(selectedDay);
    }
  }, [selectedDay]);

  const loadMonthAttendanceRecords = async () => {
    try {
      // Get all attendance records (we'll filter them client-side)
      const allRecords = await getAllAttendanceRecords();
      
      // Filter records for the current month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const recordsForMonth = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      setMonthAttendanceRecords(recordsForMonth);
    } catch (error) {
      console.error('Error loading month attendance records:', error);
    }
  };

  const loadAttendanceRecords = async (date: Date) => {
    setIsLoadingAttendance(true);
    try {
      // First check if we already have records for this day in our month cache
      const cachedRecords = monthAttendanceRecords.filter(record => 
        isSameDay(new Date(record.date), date)
      );
      
      if (cachedRecords.length > 0) {
        console.log('Using cached attendance records for', format(date, 'yyyy-MM-dd'), cachedRecords);
        setAttendanceRecords(cachedRecords);
        setIsLoadingAttendance(false);
        return;
      }
      
      // If not in cache, load from Firestore
      console.log('Loading attendance records for', format(date, 'yyyy-MM-dd'));
      const records = await getAttendanceByDate(date);
      console.log('Loaded attendance records:', records);
      setAttendanceRecords(records);
      
      // Update our cache
      setMonthAttendanceRecords(prev => {
        const filtered = prev.filter(record => !isSameDay(new Date(record.date), date));
        return [...filtered, ...records];
      });
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error loading attendance",
        description: "Could not load attendance records.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const getEventIconForDay = (day: Date) => {
    const dayEvents = events.filter(event => isSameDay(new Date(event.date), day));
    
    if (dayEvents.length === 0) return null;
    
    if (dayEvents.length === 1) {
      return dayEvents[0].icon || getDefaultIcon(dayEvents[0].type);
    }
    
    // Show count when multiple events
    return (
      <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-5 w-5 text-xs font-medium">
        {dayEvents.length}
      </div>
    );
  };

  const getAttendanceIconForDay = (day: Date) => {
    // Check if there are attendance records for this day in our month cache
    const records = monthAttendanceRecords.filter(record => 
      isSameDay(new Date(record.date), day)
    );
    
    if (records.length === 0) return null;
    
    // Show different icons based on payment status
    // Only show paid icon if ALL records are paid
    const allPaid = records.every(r => r.status === 'Paid');
    const anyUnpaid = records.some(r => r.status === 'Unpaid');
    
    if (allPaid) {
      return <DollarSign className="h-5 w-5 text-green-500" />;
    } else if (anyUnpaid) {
      return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
    
    return null;
  };

  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayDialogOpen(true);
    // Reset form values
    setSelectedEmployee('');
    setClockInTime('09:00');
    setClockOutTime('17:00');
    setActiveAttendanceTab('add');
  };

  const handleAddAttendance = async () => {
    if (!selectedDay || !selectedEmployee) {
      toast({
        title: "Missing information",
        description: "Please select an employee and provide clock-in/out times.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the selected employee
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        throw new Error("Selected employee not found");
      }

      // Convert time strings to Date objects
      const clockInDate = new Date(selectedDay);
      const [inHours, inMinutes] = clockInTime.split(':').map(Number);
      clockInDate.setHours(inHours, inMinutes, 0, 0);

      const clockOutDate = new Date(selectedDay);
      const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
      clockOutDate.setHours(outHours, outMinutes, 0, 0);

      // Create the time record
      const timeRecord: TimeRecord = {
        clockIn: clockInDate,
        clockOut: clockOutDate
      };

      // Check if there's an existing record for this employee on this day
      const existingRecord = attendanceRecords.find(
        record => record.employeeId === selectedEmployee && isSameDay(new Date(record.date), selectedDay)
      );

      let recordId: string;
      
      if (existingRecord) {
        // Add a new time record to the existing attendance record
        console.log('Adding time record to existing attendance:', {
          attendanceId: existingRecord.id,
          employeeId: employee.id,
          employeeName: employee.name,
          timeRecord
        });
        
        await addTimeRecord(existingRecord.id, timeRecord);
        recordId = existingRecord.id;
        
        toast({
          title: "Time record added",
          description: `Added new time record for ${employee.name}.`
        });
      } else {
        // Create a new attendance record
        const newRecord: Omit<EmployeeAttendance, 'id' | 'createdAt' | 'updatedAt'> = {
          employeeId: employee.id,
          employeeName: employee.name,
          date: selectedDay,
          timeRecords: [timeRecord],
          status: 'Unpaid'
        };

        console.log('Creating new attendance record:', newRecord);
        
        recordId = await addAttendanceRecord(newRecord);
        console.log('Created attendance record with ID:', recordId);
        
        toast({
          title: "Attendance recorded",
          description: `Recorded attendance for ${employee.name}.`
        });
      }

      // Verify the record was saved by retrieving it
      const savedRecord = await getAttendanceRecord(recordId);
      if (!savedRecord) {
        console.error('Failed to verify saved record:', recordId);
        throw new Error('Failed to verify the saved attendance record');
      }
      
      console.log('Successfully verified saved record:', savedRecord);

      // Reload attendance records
      await loadAttendanceRecords(selectedDay);
      
      // Also refresh the month's attendance records
      await loadMonthAttendanceRecords();
      
      // Reset form
      setSelectedEmployee('');
      setClockInTime('09:00');
      setClockOutTime('17:00');
      setActiveAttendanceTab('view');
    } catch (error) {
      console.error('Error adding attendance:', error);
      toast({
        title: "Error recording attendance",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (recordId: string, newStatus: 'Paid' | 'Unpaid') => {
    // Prevent double-clicking by setting the updating record ID
    setUpdatingRecordId(recordId);
    
    // Find the record we're updating
    const recordToUpdate = attendanceRecords.find(r => r.id === recordId);
    if (!recordToUpdate) {
      console.error(`Cannot find record with ID ${recordId} to update`);
      setUpdatingRecordId(null);
      return;
    }
    
    // Store the original status in case we need to revert
    const originalStatus = recordToUpdate.status;
    
    try {
      console.log(`Updating record ${recordId} from ${originalStatus} to ${newStatus}`);
      
      // First update the local state immediately for responsive UI
      setAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId 
            ? { ...record, status: newStatus } 
            : record
        )
      );
      
      // Also update the month cache immediately
      setMonthAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId 
            ? { ...record, status: newStatus } 
            : record
        )
      );
      
      // Then update Firestore with retry logic
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        try {
          // Use the improved Firebase function that verifies the update
          await updateAttendanceStatus(recordId, newStatus);
          success = true;
          console.log(`Successfully updated status on attempt ${attempts}`);
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) throw error;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "Status updated",
        description: `Attendance status updated to ${newStatus}.`
      });
      
      // Reload attendance records to ensure everything is in sync
      if (selectedDay) {
        await loadAttendanceRecords(selectedDay);
      }
      
      // Also refresh the month's attendance records
      await loadMonthAttendanceRecords();
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Revert the local state to the original status
      setAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId 
            ? { ...record, status: originalStatus } 
            : record
        )
      );
      
      setMonthAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId 
            ? { ...record, status: originalStatus } 
            : record
        )
      );
      
      toast({
        title: "Error updating status",
        description: "Failed to update attendance status. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Clear the updating record ID to enable the button again
      setUpdatingRecordId(null);
    }
  };

  const handleDeleteAttendance = async (recordId: string) => {
    // Open confirmation dialog
    setRecordToDelete(recordId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAttendance = async () => {
    if (!recordToDelete) return;
    
    setDeletingRecordId(recordToDelete);
    
    try {
      console.log(`Deleting attendance record ${recordToDelete}`);
      
      // First update local state to remove the record
      setAttendanceRecords(prevRecords => 
        prevRecords.filter(record => record.id !== recordToDelete)
      );
      
      // Also update the month cache
      setMonthAttendanceRecords(prevRecords => 
        prevRecords.filter(record => record.id !== recordToDelete)
      );
      
      // Then delete from Firestore
      await deleteAttendanceRecord(recordToDelete);
      
      toast({
        title: "Record deleted",
        description: "Attendance record has been deleted."
      });
      
      // Reload attendance records to ensure everything is in sync
      if (selectedDay) {
        await loadAttendanceRecords(selectedDay);
      }
      
      // Also refresh the month's attendance records
      await loadMonthAttendanceRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error deleting record",
        description: "Failed to delete attendance record. Please try again.",
        variant: "destructive"
      });
      
      // Reload to restore the deleted record if it failed
      if (selectedDay) {
        await loadAttendanceRecords(selectedDay);
      }
      await loadMonthAttendanceRecords();
    } finally {
      setDeletingRecordId(null);
      setRecordToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const cancelDeleteAttendance = () => {
    setRecordToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const getDayAttendanceColor = (day: Date) => {
    // Check if there are attendance records for this day in our month cache
    const records = monthAttendanceRecords.filter(record => 
      isSameDay(new Date(record.date), day)
    );
    
    if (records.length === 0) return '';
    
    // Determine color based on payment status
    // Only show green if ALL records are paid
    const allPaid = records.every(r => r.status === 'Paid');
    const anyUnpaid = records.some(r => r.status === 'Unpaid');
    
    if (allPaid) return 'bg-green-50 border-green-200';
    if (anyUnpaid) return 'bg-blue-50 border-blue-200';
    
    return '';
  };

  const handleEditAttendance = (record: EmployeeAttendance) => {
    setRecordToEdit(record);
    setEditEmployeeId(record.employeeId);
    
    // Format the time values for the time inputs
    if (record.timeRecords && record.timeRecords.length > 0) {
      const clockIn = record.timeRecords[0].clockIn;
      const clockOut = record.timeRecords[0].clockOut;
      
      if (clockIn) {
        setEditClockInTime(format(clockIn, 'HH:mm'));
      }
      
      if (clockOut) {
        setEditClockOutTime(format(clockOut, 'HH:mm'));
      }
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!recordToEdit || !selectedDay) return;
    
    setIsEditing(true);
    
    try {
      console.log(`Editing attendance record ${recordToEdit.id}`);
      
      // Create the updated record
      const updatedRecord: Partial<EmployeeAttendance> = {
        employeeId: editEmployeeId,
        timeRecords: [{
          clockIn: combineDateAndTime(selectedDay, editClockInTime),
          clockOut: combineDateAndTime(selectedDay, editClockOutTime)
        }]
      };
      
      // First update local state
      const updatedLocalRecord = {
        ...recordToEdit,
        employeeId: editEmployeeId,
        timeRecords: [{
          clockIn: combineDateAndTime(selectedDay, editClockInTime),
          clockOut: combineDateAndTime(selectedDay, editClockOutTime)
        }]
      };
      
      setAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordToEdit.id 
            ? updatedLocalRecord
            : record
        )
      );
      
      // Also update the month cache
      setMonthAttendanceRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordToEdit.id 
            ? updatedLocalRecord
            : record
        )
      );
      
      // Then update Firestore
      await updateAttendanceRecord(recordToEdit.id, updatedRecord);
      
      toast({
        title: "Record updated",
        description: "Attendance record has been updated successfully."
      });
      
      // Reload attendance records to ensure everything is in sync
      if (selectedDay) {
        await loadAttendanceRecords(selectedDay);
      }
      
      // Also refresh the month's attendance records
      await loadMonthAttendanceRecords();
      
      // Close the edit dialog
      setEditDialogOpen(false);
      setRecordToEdit(null);
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error updating record",
        description: "Failed to update attendance record. Please try again.",
        variant: "destructive"
      });
      
      // Reload to restore the original record if it failed
      if (selectedDay) {
        await loadAttendanceRecords(selectedDay);
      }
      await loadMonthAttendanceRecords();
    } finally {
      setIsEditing(false);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    // Days of week header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const clonedDay = day;
        const eventsForDay = getDayEvents(clonedDay);
        const formattedDate = format(clonedDay, 'd');
        const isCurrentMonth = isSameMonth(clonedDay, monthStart);
        const attendanceColor = getDayAttendanceColor(clonedDay);

        days.push(
          <div
            key={day.toString()}
            className={`relative border min-h-[100px] p-2 cursor-pointer transition-colors
              ${isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
              ${isSameDay(clonedDay, new Date()) ? 'border-primary' : 'border-border'}
              ${attendanceColor}
              hover:bg-accent hover:text-accent-foreground`}
            onClick={() => handleDayClick(clonedDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isCurrentMonth ? '' : 'opacity-50'}`}>
                {formattedDate}
              </span>
              <div className="flex space-x-1">
                {eventsForDay.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {eventsForDay.slice(0, 3).map(event => (
                      <div 
                        key={event.id} 
                        className="text-primary"
                        title={event.title}
                      >
                        {event.icon || getDefaultIcon(event.type)}
                      </div>
                    ))}
                    {eventsForDay.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{eventsForDay.length - 3}</span>
                    )}
                  </div>
                )}
                {getAttendanceIconForDay(clonedDay) && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {getAttendanceIconForDay(clonedDay)}
                  </div>
                )}
              </div>
            </div>
            {eventsForDay.length > 0 && (
              <div className="mt-1 text-xs space-y-1 max-h-[60px] overflow-hidden">
                {eventsForDay.slice(0, 2).map(event => (
                  <div 
                    key={event.id} 
                    className="truncate text-sm px-1 py-0.5 rounded bg-muted/50"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {eventsForDay.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{eventsForDay.length - 2} more</div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-center py-2 text-sm font-medium border-b">
          {daysOfWeek.map(dayName => (
            <div key={dayName}>{dayName}</div>
          ))}
        </div>
        <div className="space-y-1">
          {rows}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    let day = monthStart;
    const daysWithEvents = [];

    while (day <= monthEnd) {
      const eventsForDay = getDayEvents(day);
      if (eventsForDay.length > 0) {
        daysWithEvents.push({
          day,
          events: eventsForDay
        });
      }
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-4">
        {daysWithEvents.length > 0 ? (
          daysWithEvents.map(({ day, events }) => (
            <Card key={day.toString()} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-2">
                <CardTitle className="text-base flex justify-between">
                  <span>{format(day, 'EEEE, MMMM d')}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => handleDayClick(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {events.map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="text-primary mt-0.5">
                        {event.icon || getDefaultIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                        {event.type === 'meeting' && 'employees' in event && event.employees && event.employees.length > 0 && (
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{event.employees.length} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No events for this month</p>
          </div>
        )}
      </div>
    );
  };

  const renderDayDialog = () => {
    if (!selectedDay) return null;
    
    const eventsForDay = getDayEvents(selectedDay);
    
    return (
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{format(selectedDay, 'EEEE, MMMM d, yyyy')}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeAttendanceTab} onValueChange={setActiveAttendanceTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Attendance</TabsTrigger>
              <TabsTrigger value="view">View Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clockIn">Clock In</Label>
                    <Input
                      id="clockIn"
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clockOut">Clock Out</Label>
                    <Input
                      id="clockOut"
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleAddAttendance}
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Record Attendance
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Events</h3>
                
                {eventsForDay.length > 0 ? (
                  eventsForDay.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="text-primary mt-0.5">
                        {event.icon || getDefaultIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="flex items-center text-xs bg-muted px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{format(new Date(event.date), 'h:mm a')}</span>
                          </div>
                          
                          <div className="flex items-center text-xs bg-muted px-2 py-1 rounded-full">
                            <Briefcase className="h-3 w-3 mr-1" />
                            <span>{event.type}</span>
                          </div>
                          
                          {event.type === 'meeting' && 'employees' in event && event.employees && event.employees.length > 0 && (
                            <div className="flex items-center text-xs bg-muted px-2 py-1 rounded-full">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{event.employees.length} attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No events scheduled for this day</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="view" className="mt-4 space-y-4">
              <h3 className="text-sm font-medium">Attendance Records</h3>
              
              {isLoadingAttendance ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : attendanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {attendanceRecords.map(record => (
                    <Card key={record.id} className="overflow-hidden">
                      <CardHeader className={`py-3 ${record.status === 'Paid' ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <CardTitle className="text-base flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{record.employeeName}</span>
                          </div>
                          <Badge variant={record.status === 'Paid' ? 'default' : 'outline'}>
                            {record.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {record.timeRecords.map((timeRecord, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2 text-green-600" />
                                <span>In: {format(new Date(timeRecord.clockIn), 'h:mm a')}</span>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2 text-red-600" />
                                <span>Out: {timeRecord.clockOut ? format(new Date(timeRecord.clockOut), 'h:mm a') : 'Not clocked out'}</span>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-end space-x-2 mt-4">
                            {record.status === 'Unpaid' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                onClick={() => handleUpdateStatus(record.id, 'Paid')}
                                disabled={updatingRecordId === record.id || deletingRecordId === record.id}
                              >
                                {updatingRecordId === record.id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-green-700 border-t-transparent rounded-full"></div>
                                    Updating...
                                  </div>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Mark as Paid
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                onClick={() => handleUpdateStatus(record.id, 'Unpaid')}
                                disabled={updatingRecordId === record.id || deletingRecordId === record.id}
                              >
                                {updatingRecordId === record.id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-700 border-t-transparent rounded-full"></div>
                                    Updating...
                                  </div>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 mr-1" />
                                    Mark as Unpaid
                                  </>
                                )}
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                              onClick={() => handleEditAttendance(record)}
                              disabled={updatingRecordId === record.id || deletingRecordId === record.id}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              onClick={() => handleDeleteAttendance(record.id)}
                              disabled={updatingRecordId === record.id || deletingRecordId === record.id}
                            >
                              {deletingRecordId === record.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-red-700 border-t-transparent rounded-full"></div>
                                  Deleting...
                                </div>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ClockIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No attendance records for this day</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setActiveAttendanceTab('add')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Attendance
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="ml-2">
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-4 text-sm">
            <div className="flex items-center mr-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span>Paid</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span>Unpaid</span>
            </div>
          </div>
          
          <Button 
            variant={viewType === 'month' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewType('month')}
            className="flex items-center gap-1"
          >
            <Grid2X2 className="h-4 w-4" />
            Month
          </Button>
          <Button 
            variant={viewType === 'list' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewType('list')}
            className="flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>
      
      {viewType === 'month' ? renderMonthView() : renderListView()}
      {renderDayDialog()}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteAttendance}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAttendance}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance details for this record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-employee" className="text-right">
                Employee
              </Label>
              <Select value={editEmployeeId} onValueChange={setEditEmployeeId} disabled={isEditing}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-clock-in" className="text-right">
                Clock In
              </Label>
              <Input
                id="edit-clock-in"
                type="time"
                value={editClockInTime}
                onChange={(e) => setEditClockInTime(e.target.value)}
                className="col-span-3"
                disabled={isEditing}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-clock-out" className="text-right">
                Clock Out
              </Label>
              <Input
                id="edit-clock-out"
                type="time"
                value={editClockOutTime}
                onChange={(e) => setEditClockOutTime(e.target.value)}
                className="col-span-3"
                disabled={isEditing}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={isEditing}
            >
              {isEditing ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
