
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, BarChart, Users, FileText } from 'lucide-react';
import { EventsManager } from './Calendar/EventsManager';
import { CalendarBoard } from './Calendar/CalendarBoard';
import PayrollFlowEditor from './PayrollFlow/PayrollFlowEditor';

// Define a proper type for our events
type EventType = 'payroll' | 'holiday' | 'meeting' | 'vacation';

interface BaseEvent {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  icon: React.ReactNode;
  description: string;
}

interface EmployeeEvent extends BaseEvent {
  type: 'meeting' | 'vacation';
  employees: string[];
}

interface StandardEvent extends BaseEvent {
  type: 'payroll' | 'holiday';
}

type Event = StandardEvent | EmployeeEvent;

// Mock data for demonstration
const mockEmployees = [
  { id: '1', name: 'John Doe', position: 'Developer' },
  { id: '2', name: 'Jane Smith', position: 'Designer' },
  { id: '3', name: 'Mike Johnson', position: 'Manager' },
  { id: '4', name: 'Sarah Williams', position: 'HR Specialist' },
  { id: '5', name: 'Alex Brown', position: 'Accountant' },
];

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Monthly Payroll Processing',
    date: new Date(2023, 9, 15),
    type: 'payroll',
    icon: <BarChart className="h-5 w-5" />,
    description: 'Process monthly payroll for all departments',
  },
  {
    id: '2',
    title: 'Company Holiday',
    date: new Date(2023, 9, 25),
    type: 'holiday',
    icon: <CalendarDays className="h-5 w-5" />,
    description: 'Office closed for annual company holiday',
  },
  {
    id: '3',
    title: 'HR Meeting',
    date: new Date(2023, 9, 10),
    type: 'meeting',
    icon: <Users className="h-5 w-5" />,
    employees: ['1', '4', '5'],
    description: 'Quarterly HR policy review meeting',
  },
  {
    id: '4',
    title: 'John Doe Vacation',
    date: new Date(2023, 9, 18),
    type: 'vacation',
    icon: <Users className="h-5 w-5" />,
    employees: ['1'],
    description: 'Approved vacation leave',
  },
];

export const TabsNavigation = () => {
  // In a real application, these would be managed in a global state or context
  const [events, setEvents] = React.useState(mockEvents);
  const [activeTab, setActiveTab] = React.useState("payroll-flow");

  const handleAddEvent = (event: Omit<BaseEvent, 'id'> & { employees?: string[] }) => {
    // Create a new event with the appropriate type
    let newEvent: Event;
    
    if (event.type === 'meeting' || event.type === 'vacation') {
      newEvent = {
        ...event,
        id: `event-${Date.now()}`,
        employees: event.employees || [],
      } as EmployeeEvent;
    } else {
      newEvent = {
        ...event,
        id: `event-${Date.now()}`,
      } as StandardEvent;
    }
    
    setEvents([...events, newEvent]);
  };

  return (
    <Tabs defaultValue="payroll-flow" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="payroll-flow" className="flex items-center">
          <BarChart className="h-4 w-4 mr-2" />
          Payroll Flow
        </TabsTrigger>
        <TabsTrigger value="calendar-board" className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2" />
          Calendar Board
        </TabsTrigger>
        <TabsTrigger value="events" className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Events
        </TabsTrigger>
        <TabsTrigger value="employees" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Employees
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="payroll-flow" className="mt-0">
        <PayrollFlowEditor />
      </TabsContent>
      
      <TabsContent value="calendar-board" className="mt-0">
        <CalendarBoard events={events} />
      </TabsContent>
      
      <TabsContent value="events" className="mt-0">
        <EventsManager 
          events={events} 
          onEventAdd={handleAddEvent}
          employees={mockEmployees}
        />
      </TabsContent>
      
      <TabsContent value="employees" className="mt-0">
        <div className="text-center p-8 text-muted-foreground">
          <h3 className="text-xl font-medium mb-2">Employee Management</h3>
          <p>Employee management functionality will be implemented here.</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};
