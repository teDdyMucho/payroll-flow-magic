import React, { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, BarChart, Users, FileText } from 'lucide-react';
import { EventsManager } from './Calendar/EventsManager';
import { CalendarBoard } from './Calendar/CalendarBoard';
import PayrollFlowEditor from './PayrollFlow/PayrollFlowEditor';
import { addEvent, getAllEvents, eventsRef } from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { toast } from "@/components/ui/use-toast";

// Define a proper type for our events
export type EventType = 'payroll' | 'holiday' | 'meeting' | 'vacation';

export interface BaseEvent {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  icon?: React.ReactNode;
  description: string;
}

export interface EmployeeEvent extends BaseEvent {
  type: 'meeting' | 'vacation';
  employees: string[];
}

export interface StandardEvent extends BaseEvent {
  type: 'payroll' | 'holiday';
}

export type Event = StandardEvent | EmployeeEvent;

// Mock data for demonstration
const mockEmployees = [
  { id: '1', name: 'John Doe', position: 'Developer' },
  { id: '2', name: 'Jane Smith', position: 'Designer' },
  { id: '3', name: 'Mike Johnson', position: 'Manager' },
  { id: '4', name: 'Sarah Williams', position: 'HR Specialist' },
  { id: '5', name: 'Alex Brown', position: 'Accountant' },
];

// Map event types to icons for display
const getEventIcon = (type: EventType) => {
  switch (type) {
    case 'payroll':
      return <BarChart className="h-5 w-5" />;
    case 'holiday':
      return <CalendarDays className="h-5 w-5" />;
    case 'meeting':
    case 'vacation':
      return <Users className="h-5 w-5" />;
    default:
      return <CalendarDays className="h-5 w-5" />;
  }
};

export const TabsNavigation = () => {
  // In a real application, these would be managed in a global state or context
  const [events, setEvents] = React.useState<Event[]>([]);
  const [activeTab, setActiveTab] = React.useState("employee-database");
  const [isLoading, setIsLoading] = React.useState(true);

  // Load events from Firestore on component mount
  useEffect(() => {
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      try {
        const eventsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            // Add icon based on event type
            icon: getEventIcon(data.type as EventType),
            // Ensure description is always a string
            description: data.description || '',
          } as Event;
        });
        setEvents(eventsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error loading events",
          description: "Failed to load events from database.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (event: Omit<BaseEvent, 'id' | 'icon'> & { icon?: React.ReactNode, employees?: string[] }) => {
    try {
      // Create a new event with the appropriate type
      let newEvent: Omit<Event, 'id'>;
      
      if (event.type === 'meeting' || event.type === 'vacation') {
        newEvent = {
          ...event,
          employees: event.employees || [],
        } as Omit<EmployeeEvent, 'id'>;
      } else {
        newEvent = {
          ...event,
        } as Omit<StandardEvent, 'id'>;
      }
      
      // Save to Firestore
      await addEvent(newEvent);
      
      toast({
        title: "Event Added",
        description: "Your event has been successfully added.",
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error adding event",
        description: "Failed to add event to database.",
        variant: "destructive"
      });
    }
  };

  return (
    <Tabs 
      defaultValue="employee-database" 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full h-full flex flex-col"
    >
      <div className="px-4 pt-2 border-b flex-shrink-0">
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="employee-database" className="flex items-center text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Employee Database
          </TabsTrigger>
          <TabsTrigger value="payroll-flow" className="flex items-center text-sm">
            <BarChart className="h-3.5 w-3.5 mr-1.5" />
            Payroll Flow
          </TabsTrigger>
          <TabsTrigger value="calendar-board" className="flex items-center text-sm">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Calendar Board
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center text-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Events
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="flex-1 overflow-auto">
        <TabsContent value="employee-database" className="mt-0 h-full p-4">
          <div className="text-center p-8 text-muted-foreground">
            <h3 className="text-xl font-medium mb-2">Employee Management</h3>
            <p>Employee management functionality will be implemented here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="payroll-flow" className="mt-0 h-full">
          <PayrollFlowEditor />
        </TabsContent>
        
        <TabsContent value="calendar-board" className="mt-0 h-full p-4">
          <CalendarBoard events={events} />
        </TabsContent>
        
        <TabsContent value="events" className="mt-0 h-full p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <EventsManager 
              events={events} 
              onEventAdd={handleAddEvent}
              employees={mockEmployees}
            />
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
