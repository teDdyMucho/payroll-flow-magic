import React, { useState } from 'react';
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
  BarChart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Event, EventType } from '../TabsNavigation';

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

export const CalendarBoard = ({ events }: CalendarBoardProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'list'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

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

  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayDialogOpen(true);
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

        days.push(
          <div
            key={day.toString()}
            className={`relative border min-h-[100px] p-2 cursor-pointer transition-colors
              ${isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
              ${isSameDay(clonedDay, new Date()) ? 'border-primary' : 'border-border'}
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
          
          <div className="mt-4 space-y-4">
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
    </div>
  );
};
