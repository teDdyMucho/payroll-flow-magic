import React, { useState } from 'react';
import { Calendar, Clock, Users, Star, Flag, Briefcase, Heart, Award, Gift, PartyPopper, Coffee, Plane, Umbrella } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'vacation' | 'payroll' | 'meeting' | 'holiday';
  icon?: React.ReactNode;
  description?: string;
  employees?: string[];
}

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface EventsManagerProps {
  events: Event[];
  onEventAdd: (event: Omit<Event, 'id' | 'icon'> & { icon?: React.ReactNode }) => void;
  employees: Employee[];
}

// Define EVENT_ICONS outside of the component to avoid re-creation on each render
const EVENT_ICONS = [
  { name: 'Calendar', icon: <Calendar className="h-5 w-5" /> },
  { name: 'Vacation', icon: <Plane className="h-5 w-5" /> },
  { name: 'Meeting', icon: <Users className="h-5 w-5" /> },
  { name: 'Holiday', icon: <PartyPopper className="h-5 w-5" /> },
  { name: 'Payroll', icon: <Briefcase className="h-5 w-5" /> },
  { name: 'Award', icon: <Award className="h-5 w-5" /> },
  { name: 'Star', icon: <Star className="h-5 w-5" /> },
  { name: 'Gift', icon: <Gift className="h-5 w-5" /> },
  { name: 'Flag', icon: <Flag className="h-5 w-5" /> },
  { name: 'Heart', icon: <Heart className="h-5 w-5" /> },
  { name: 'Coffee', icon: <Coffee className="h-5 w-5" /> },
  { name: 'Umbrella', icon: <Umbrella className="h-5 w-5" /> },
];

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'vacation', label: 'Vacation' },
];

export const EventsManager = ({ events, onEventAdd, employees }: EventsManagerProps) => {
  const [activeTab, setActiveTab] = useState("add-event");
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: new Date(),
    type: 'meeting',
    description: '',
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<React.ReactNode>(<Calendar className="h-5 w-5" />);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Missing information",
        description: "Please provide a title and date for the event.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onEventAdd({
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type as 'vacation' | 'payroll' | 'meeting' | 'holiday',
        description: newEvent.description || '',
        employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        icon: selectedIcon,
      });
      
      // Reset form
      setNewEvent({
        title: '',
        date: new Date(),
        type: 'meeting',
        description: '',
      });
      setSelectedEmployees([]);
      setSelectedIcon(<Calendar className="h-5 w-5" />);
      
      // Switch to view events tab
      setActiveTab("view-events");
    } catch (error) {
      console.error('Error submitting event:', error);
      toast({
        title: "Error adding event",
        description: "There was a problem adding your event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  // Helper function to safely check icon equality without using JSON.stringify
  const isSelectedIcon = (iconA: React.ReactNode, iconB: React.ReactNode) => {
    // Simple check for icon elements - comparing their types and props might be sufficient
    if (React.isValidElement(iconA) && React.isValidElement(iconB)) {
      return iconA.type === iconB.type && 
             iconA.props.className === iconB.props.className;
    }
    return false;
  };

  const renderAddEventForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          placeholder="Enter event title"
          value={newEvent.title || ''}
          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-date">Date</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="event-date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setDatePickerOpen(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {newEvent.date ? format(newEvent.date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={newEvent.date}
                onSelect={(date) => {
                  if (date) {
                    setNewEvent({...newEvent, date});
                    setDatePickerOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Event Type</Label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => (
              <Button
                key={type.value}
                type="button"
                variant={newEvent.type === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setNewEvent({...newEvent, type: type.value as any})}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Event Icon</Label>
        <div className="grid grid-cols-6 gap-2">
          {EVENT_ICONS.map((iconObj, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="icon"
              className={`h-10 w-10 ${isSelectedIcon(iconObj.icon, selectedIcon) ? 'border-primary bg-primary/10' : ''}`}
              onClick={() => setSelectedIcon(iconObj.icon)}
            >
              {iconObj.icon}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter event description"
          value={newEvent.description || ''}
          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Employees (Optional)</Label>
        <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
          <div className="space-y-2">
            {employees.length > 0 ? (
              employees.map(employee => (
                <div 
                  key={employee.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedEmployees.includes(employee.id) ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                  onClick={() => toggleEmployeeSelection(employee.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center">
                    {selectedEmployees.includes(employee.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No employees available</p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⟳</span>
            Adding Event...
          </>
        ) : (
          'Add Event'
        )}
      </Button>
    </form>
  );

  const renderEventsList = () => (
    <div className="space-y-4">
      {events.length > 0 ? (
        events.map(event => (
          <Card key={event.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <div className="mr-2 text-primary">{event.icon}</div>
                {event.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(new Date(event.date), 'PPP')}
                </div>
                
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
                
                {event.employees && event.employees.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-1 flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Employees
                    </p>
                    <div className="pl-6 space-y-1">
                      {event.employees.map(employeeId => {
                        const employee = employees.find(e => e.id === employeeId);
                        return employee ? (
                          <p key={employee.id} className="text-sm">
                            {employee.name} <span className="text-muted-foreground">({employee.position})</span>
                          </p>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No events have been created yet</p>
          <Button 
            variant="link" 
            onClick={() => setActiveTab("add-event")}
            className="mt-2"
          >
            Create your first event
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="add-event" className="flex-1">Add Event</TabsTrigger>
          <TabsTrigger value="view-events" className="flex-1">View Events ({events.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-event" className="mt-0">
          {renderAddEventForm()}
        </TabsContent>
        
        <TabsContent value="view-events" className="mt-0">
          {renderEventsList()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
