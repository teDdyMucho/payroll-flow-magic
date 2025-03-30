
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
  Upload
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'vacation' | 'payroll' | 'meeting' | 'holiday';
  icon: React.ReactNode;
  employees?: string[];
}

interface CalendarBoardProps {
  events: Event[];
}

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
      return dayEvents[0].icon;
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
                        {event.icon}
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
                    Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      className="flex items-center p-2 rounded-md hover:bg-accent"
                    >
                      <div className="mr-3 text-primary">
                        {event.icon}
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        {event.employees && event.employees.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {event.employees.length} employee(s) involved
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No events scheduled for this month
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="border rounded-md overflow-hidden flex">
            <Button 
              variant={viewType === 'month' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('month')}
              className="rounded-none"
            >
              <Grid2X2 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button 
              variant={viewType === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewType === 'month' ? renderMonthView() : renderListView()}
      </div>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDay && getDayEvents(selectedDay).length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">Events</h3>
                {getDayEvents(selectedDay).map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-center p-3 rounded-md border"
                  >
                    <div className="mr-3 text-primary">
                      {event.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      {event.employees && event.employees.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {event.employees.length} employee(s) involved
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No events scheduled for this day
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Initiate Payroll
                </Button>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Time Records
                </Button>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Times
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
