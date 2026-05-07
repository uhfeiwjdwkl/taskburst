import { useState, useEffect, useMemo } from 'react';
import { Timetable, FlexibleEvent, TimeSlot } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Copy, Clipboard, Move, Trash2, GripVertical, CheckSquare } from 'lucide-react';
import { FlexibleEventDetailsDialog } from './FlexibleEventDetailsDialog';
import { toast } from 'sonner';
import { useAppSettings } from '@/hooks/useAppSettings';
import { ColorPickerGrid } from './ColorPickerGrid';
import { ConfirmDelete } from './ConfirmDeleteButton';

interface FlexibleTimetableGridProps {
  timetable: Timetable;
  isEditing?: boolean;
  currentWeek?: 1 | 2;
  onUpdateTimetable?: (timetable: Timetable) => void;
  activeIsolatedColour?: string | null;
}

// Storage key for flexible events
const FLEXIBLE_EVENTS_KEY = 'flexibleTimetableEvents';

export function FlexibleTimetableGrid({ 
  timetable, 
  isEditing = false,
  currentWeek = 1,
  onUpdateTimetable,
  activeIsolatedColour = null,
}: FlexibleTimetableGridProps) {
  const appSettings = useAppSettings();
  const [events, setEvents] = useState<FlexibleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FlexibleEvent | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEventDay, setNewEventDay] = useState<number | null>(null);
  
  // Copy/paste/move state
  const [copiedEvent, setCopiedEvent] = useState<FlexibleEvent | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [movingEvent, setMovingEvent] = useState<FlexibleEvent | null>(null);
  const [selectedForAction, setSelectedForAction] = useState<string | null>(null);
  // Dragging state
  const [draggingEvent, setDraggingEvent] = useState<FlexibleEvent | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);

  // Bulk-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [bulkColor, setBulkColor] = useState<string>('#3b82f6');
  const [bulkName, setBulkName] = useState<string>('');

  // Form state for adding new events (full settings)
  const [newEventDraft, setNewEventDraft] = useState<FlexibleEvent | null>(null);

  // Load events from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FLEXIBLE_EVENTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const allEvents = Array.isArray(parsed) ? parsed as FlexibleEvent[] : [];
        setEvents(allEvents.filter(e => e.timetableId === timetable.id));
      } catch { setEvents([]); }
    }
  }, [timetable.id]);

  // Reactively group events by colour into colorKey entries
  useEffect(() => {
    if (!onUpdateTimetable) return;
    const uniqueColors = Array.from(
      new Set(events.map(e => e.color).filter((c): c is string => !!c))
    );
    const currentKey = timetable.colorKey || {};
    const missing = uniqueColors.filter(c => !(c in currentKey));
    if (missing.length === 0) return;
    const updatedKey = { ...currentKey };
    missing.forEach(c => { updatedKey[c] = currentKey[c] || ''; });
    onUpdateTimetable({ ...timetable, colorKey: updatedKey });
  }, [events, timetable, onUpdateTimetable]);

  // Save events to localStorage
  const saveEvents = (newEvents: FlexibleEvent[]) => {
    const saved = localStorage.getItem(FLEXIBLE_EVENTS_KEY);
    let allEvents: FlexibleEvent[] = [];
    try { const p = saved ? JSON.parse(saved) : []; allEvents = Array.isArray(p) ? p : []; } catch {}
    const otherEvents = allEvents.filter(e => e.timetableId !== timetable.id);
    localStorage.setItem(FLEXIBLE_EVENTS_KEY, JSON.stringify([...otherEvents, ...newEvents]));
    setEvents(newEvents);
  };

  // Calculate time range
  const startTime = timetable.flexStartTime || '06:00';
  const endTime = timetable.flexEndTime || '22:00';
  const interval = timetable.flexInterval || 60;
  // Honour app-level 24hr setting if enabled, otherwise use the timetable's own setting
  const timeFormat: '12h' | '24h' = appSettings.timeFormat === '24h'
    ? '24h'
    : (timetable.flexTimeFormat || '12h');

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const startMinutesOfDay = startHour * 60 + startMin;

  // Format time based on setting
  const formatTime = (time: string) => {
    if (timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Generate time markers
  const timeMarkers: string[] = [];
  for (let m = startHour * 60 + startMin; m <= endHour * 60 + endMin; m += interval) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    timeMarkers.push(`${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }

  // Calculate current time position
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = ((currentMinutes - startMinutesOfDay) / totalMinutes) * 100;
  const showCurrentTime = currentPosition >= 0 && currentPosition <= 100;
  
  // Get current day of week (0 = Sunday, so we adjust for Mon-Fri columns)
  const currentDayOfWeek = now.getDay();
  // Adjust to match timetable columns (0 = Monday in most timetables)
  const adjustedCurrentDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, event: FlexibleEvent) => {
    if (!moveMode) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggingEvent(event);
  };
  
  const handleDragEnd = () => {
    setDraggingEvent(null);
    setDragOverDay(null);
    setDragOverTime(null);
  };
  
  const handleDragOver = (e: React.DragEvent, dayIndex: number, yPosition: number, containerHeight: number) => {
    if (!draggingEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragOverDay(dayIndex);
    
    // Calculate time from Y position
    const percentage = yPosition / containerHeight;
    const minutesFromStart = Math.round(percentage * totalMinutes / interval) * interval;
    const newMinutes = startMinutesOfDay + minutesFromStart;
    const newHour = Math.floor(newMinutes / 60);
    const newMin = newMinutes % 60;
    setDragOverTime(`${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`);
  };
  
  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (!draggingEvent || !dragOverTime) return;
    
    // Calculate event duration
    const [startH, startM] = draggingEvent.startTime.split(':').map(Number);
    const [endH, endM] = draggingEvent.endTime.split(':').map(Number);
    const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
    
    // Calculate new end time
    const [newStartH, newStartM] = dragOverTime.split(':').map(Number);
    const newEndMins = newStartH * 60 + newStartM + durationMins;
    const newEndH = Math.floor(newEndMins / 60);
    const newEndM = newEndMins % 60;
    const newEndTime = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;
    
    const updated = events.map(e => 
      e.id === draggingEvent.id 
        ? { 
            ...e, 
            dayIndex, 
            startTime: dragOverTime,
            endTime: newEndTime,
            week: timetable.type === 'fortnightly' ? currentWeek : undefined 
          } 
        : e
    );
    saveEvents(updated);
    toast.success('Event moved');
    
    setDraggingEvent(null);
    setDragOverDay(null);
    setDragOverTime(null);
  };


  // Get position and height for an event
  const getEventStyle = (event: FlexibleEvent) => {
    const [eventStartH, eventStartM] = event.startTime.split(':').map(Number);
    const [eventEndH, eventEndM] = event.endTime.split(':').map(Number);
    const eventStartMins = eventStartH * 60 + eventStartM;
    const eventEndMins = eventEndH * 60 + eventEndM;
    
    const top = ((eventStartMins - startMinutesOfDay) / totalMinutes) * 100;
    const height = ((eventEndMins - eventStartMins) / totalMinutes) * 100;
    
    return {
      top: `${Math.max(0, top)}%`,
      height: `${Math.max(2, height)}%`,
    };
  };

  const handleAddEvent = (dayIndex: number) => {
    // If moving an event, move it to this day instead
    if (moveMode && movingEvent) {
      const updated = events.map(e => 
        e.id === movingEvent.id ? { ...e, dayIndex, week: timetable.type === 'fortnightly' ? currentWeek : undefined } : e
      );
      saveEvents(updated);
      setMovingEvent(null);
      setMoveMode(false);
      toast.success('Event moved');
      return;
    }
    
    // If pasting a copied event
    if (copiedEvent) {
      const newEvent: FlexibleEvent = {
        ...copiedEvent,
        id: Date.now().toString(),
        dayIndex,
        week: timetable.type === 'fortnightly' ? currentWeek : undefined,
      };
      saveEvents([...events, newEvent]);
      setCopiedEvent(null);
      toast.success('Event pasted');
      return;
    }
    
    setNewEventDay(dayIndex);
    setNewEventDraft({
      id: 'new-' + Date.now().toString(),
      timetableId: timetable.id,
      dayIndex,
      startTime: startTime,
      endTime: (() => {
        // default end = start + interval (capped at end)
        const [h, m] = startTime.split(':').map(Number);
        const endMins = Math.min(h * 60 + m + interval, endHour * 60 + endMin);
        return `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;
      })(),
      title: '',
      fields: [],
      week: timetable.type === 'fortnightly' ? currentWeek : undefined,
    });
    setAddDialogOpen(true);
  };

  const handleEventClick = (event: FlexibleEvent) => {
    if (selectMode) {
      setSelectedEventIds(prev =>
        prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id]
      );
      return;
    }
    if (moveMode) {
      setMovingEvent(event);
      toast.info('Click on a day column to move the event there');
      return;
    }
    
    if (isEditing) {
      // In edit mode, open the edit dialog directly
      setSelectedEvent(event);
      setDetailsDialogOpen(true);
    } else {
      setSelectedEvent(event);
      setDetailsDialogOpen(true);
    }
  };

  const handleCopyEvent = (event: FlexibleEvent) => {
    setCopiedEvent(event);
    setSelectedForAction(null);
    toast.success('Event copied. Click on a day to paste.');
  };

  const handleDeleteSelectedEvent = (eventId: string) => {
    saveEvents(events.filter(e => e.id !== eventId));
    setSelectedForAction(null);
    toast.success('Event deleted');
  };

  // Validate that event times fall within timetable bounds
  const validateEventBounds = (ev: FlexibleEvent): string | null => {
    const [sH, sM] = ev.startTime.split(':').map(Number);
    const [eH, eM] = ev.endTime.split(':').map(Number);
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    const ttStart = startHour * 60 + startMin;
    const ttEnd = endHour * 60 + endMin;
    if (eMin <= sMin) return 'End time must be after start time';
    if (sMin < ttStart || eMin > ttEnd) {
      return `Event must be between ${formatTime(startTime)} and ${formatTime(endTime)}`;
    }
    if (ev.dayIndex < 0 || ev.dayIndex >= timetable.columns.length) {
      return 'Event day is outside the timetable';
    }
    return null;
  };

  const handleSaveNewEvent = (draft: FlexibleEvent) => {
    if (!draft.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const err = validateEventBounds(draft);
    if (err) {
      toast.error(err);
      return;
    }
    const newEvent: FlexibleEvent = { ...draft, id: Date.now().toString() };
    saveEvents([...events, newEvent]);
    setAddDialogOpen(false);
    setNewEventDraft(null);
  };

  const handleSaveEvent = (updatedEvent: FlexibleEvent) => {
    const err = validateEventBounds(updatedEvent);
    if (err) {
      toast.error(err);
      return;
    }
    const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    saveEvents(updated);
    setDetailsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    saveEvents(events.filter(e => e.id !== eventId));
    setDetailsDialogOpen(false);
    setSelectedEvent(null);
  };

  // Bulk edit helpers
  const applyBulkColor = (color: string) => {
    setBulkColor(color);
    if (selectedEventIds.length === 0) return;
    const updated = events.map(e => selectedEventIds.includes(e.id) ? { ...e, color } : e);
    saveEvents(updated);
  };
  const applyBulkName = (name: string) => {
    setBulkName(name);
    if (selectedEventIds.length === 0) return;
    const updated = events.map(e => selectedEventIds.includes(e.id) ? { ...e, title: name } : e);
    saveEvents(updated);
  };
  const handleBulkDelete = () => {
    if (selectedEventIds.length === 0) return;
    saveEvents(events.filter(e => !selectedEventIds.includes(e.id)));
    setSelectedEventIds([]);
    toast.success('Selected events deleted');
  };

  return (
    <div className="border-2 rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
      {/* Edit mode toolbar */}
      {isEditing && (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Switch
              id="moveMode"
              checked={moveMode}
              onCheckedChange={(checked) => {
                setMoveMode(checked);
                if (!checked) setMovingEvent(null);
              }}
            />
            <Label htmlFor="moveMode" className="text-sm flex items-center gap-1">
              <Move className="h-3 w-3" />
              Move Mode
            </Label>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Switch
              id="selectMode"
              checked={selectMode}
              onCheckedChange={(checked) => {
                setSelectMode(checked);
                if (!checked) setSelectedEventIds([]);
              }}
            />
            <Label htmlFor="selectMode" className="text-sm flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              Select
            </Label>
          </div>
          
          {copiedEvent && (
            <div className="flex items-center gap-2 ml-4 text-sm text-muted-foreground">
              <Clipboard className="h-3 w-3" />
              <span>"{copiedEvent.title}" copied - click a day to paste</span>
              <Button variant="ghost" size="sm" onClick={() => setCopiedEvent(null)} className="h-6 px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {movingEvent && (
            <div className="flex items-center gap-2 ml-4 text-sm text-muted-foreground">
              <Move className="h-3 w-3" />
              <span>Moving "{movingEvent.title}" - click a day</span>
              <Button variant="ghost" size="sm" onClick={() => setMovingEvent(null)} className="h-6 px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
      {isEditing && selectMode && (
        <div className="flex flex-wrap items-center gap-3 p-2 border-b bg-muted/20">
          <span className="text-xs font-medium">{selectedEventIds.length} selected</span>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Name:</Label>
            <Input
              value={bulkName}
              onChange={(e) => applyBulkName(e.target.value)}
              placeholder="Apply to all selected"
              className="h-7 w-48 text-xs"
              disabled={selectedEventIds.length === 0}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Colour:</Label>
            <div className={selectedEventIds.length === 0 ? 'opacity-50 pointer-events-none' : ''}>
              <ColorPickerGrid
                value={bulkColor}
                onChange={applyBulkColor}
                showCustomInput={false}
                colorKey={timetable.colorKey}
              />
            </div>
          </div>
          <ConfirmDelete
            onConfirm={handleBulkDelete}
            title="Delete selected events?"
            description={`${selectedEventIds.length} event(s) will be deleted.`}
            trigger={(open) => (
              <Button variant="destructive" size="sm" disabled={selectedEventIds.length === 0} onClick={open}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-y-auto">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r bg-muted/30">
          <div className="h-10 border-b" /> {/* Header spacer */}
          <div className="relative" style={{ height: `${timeMarkers.length * 40}px` }}>
            {timeMarkers.map((time, i) => (
              <div
                key={time}
                className="absolute left-0 right-0 text-xs text-muted-foreground px-2"
                style={{ top: `${(i / (timeMarkers.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}
              >
                {formatTime(time)}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${timetable.columns.length}, 1fr)` }}>
          {/* Day headers */}
          {timetable.columns.map((day, dayIndex) => (
            <div
              key={day}
              className={cn(
                "border-b-2 border-r-2 flex flex-col items-center justify-center font-medium text-sm bg-muted/30 py-1 gap-1",
                (copiedEvent || movingEvent) && "cursor-pointer hover:bg-primary/10",
                dayIndex === adjustedCurrentDay && "bg-primary/10 font-semibold"
              )}
              onClick={() => (copiedEvent || movingEvent) && handleAddEvent(dayIndex)}
            >
              <span className={cn(dayIndex === adjustedCurrentDay && "text-primary")}>{day.slice(0, 3)}</span>
              {isEditing && !copiedEvent && !movingEvent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px] opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); handleAddEvent(dayIndex); }}
                >
                  <Plus className="h-3 w-3 mr-0.5" /> Add
                </Button>
              )}
            </div>
          ))}

          {/* Day content */}
          {timetable.columns.map((day, dayIndex) => {
            const dayEvents = events.filter(e => 
              e.dayIndex === dayIndex && 
              (timetable.type !== 'fortnightly' || !e.week || e.week === currentWeek)
            );
            
            const isCurrentDay = dayIndex === adjustedCurrentDay;

            return (
              <div
                key={`content-${dayIndex}`}
                className={cn(
                  "relative border-r-2",
                  (copiedEvent || movingEvent) && "cursor-pointer hover:bg-primary/5",
                  isCurrentDay && "bg-primary/5",
                  dragOverDay === dayIndex && "bg-primary/10"
                )}
                style={{ height: `${timeMarkers.length * 40}px` }}
                onClick={(e) => {
                  // Only trigger paste/move on empty area clicks
                  if ((copiedEvent || movingEvent) && e.target === e.currentTarget) {
                    handleAddEvent(dayIndex);
                  }
                }}
                onDragOver={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const yPos = e.clientY - rect.top;
                  handleDragOver(e, dayIndex, yPos, rect.height);
                }}
                onDrop={(e) => handleDrop(e, dayIndex)}
              >
                {/* Time grid lines */}
                {timeMarkers.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-border/50"
                    style={{ top: `${(i / (timeMarkers.length - 1)) * 100}%` }}
                  />
                ))}

                {/* Current time indicator - show on current day */}
                {showCurrentTime && isCurrentDay && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                    style={{ top: `${currentPosition}%` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}
                
                {/* Drop indicator */}
                {dragOverDay === dayIndex && dragOverTime && (
                  <div
                    className="absolute left-1 right-1 h-1 bg-primary/50 rounded z-20"
                    style={{
                      top: (() => {
                        const [h, m] = dragOverTime.split(':').map(Number);
                        const mins = h * 60 + m;
                        return `${((mins - startMinutesOfDay) / totalMinutes) * 100}%`;
                      })()
                    }}
                  />
                )}

                {/* Events */}
                {dayEvents.map(event => {
                  const isSelected = selectedForAction === event.id;
                  const isMoving = movingEvent?.id === event.id;
                  const isDragging = draggingEvent?.id === event.id;
                  const isDimmed = !!activeIsolatedColour && event.color !== activeIsolatedColour;
                  
                  return (
                    <div
                      key={event.id}
                      draggable={moveMode}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={cn(
                        "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer text-xs overflow-hidden border",
                        "hover:ring-2 hover:ring-ring transition-all",
                        isSelected && "ring-2 ring-primary",
                        selectMode && selectedEventIds.includes(event.id) && "ring-2 ring-primary",
                        isMoving && "opacity-50 ring-2 ring-yellow-500",
                        isDragging && "opacity-30",
                        moveMode && "cursor-grab active:cursor-grabbing",
                        isDimmed && "grayscale opacity-30"
                      )}
                      style={{
                        ...getEventStyle(event),
                        backgroundColor: event.color ? `${event.color}30` : 'hsl(var(--primary) / 0.2)',
                        borderLeft: `3px solid ${event.color || 'hsl(var(--primary))'}`,
                      }}
                    >
                      {moveMode && (
                        <GripVertical className="absolute top-1 right-1 h-3 w-3 opacity-50" />
                      )}
                      <div className="font-medium truncate" style={{ color: event.color || 'hsl(var(--primary))' }}>
                        {event.title}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      
                      {/* Action buttons when selected in edit mode */}
                      {isEditing && isSelected && (
                        <div className="absolute top-0 right-0 flex gap-1 bg-background rounded-bl p-1 shadow-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEvent(event);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <ConfirmDelete
                            onConfirm={() => handleDeleteSelectedEvent(event.id)}
                            title="Delete this event?"
                            trigger={(open) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={(e) => { e.stopPropagation(); open(); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Dialog */}
      <FlexibleEventDetailsDialog
        event={selectedEvent}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        timeFormat={timeFormat}
      />

      {/* Add Event Dialog — uses the same full settings form as edit */}
      <FlexibleEventDetailsDialog
        event={addDialogOpen ? newEventDraft : null}
        open={addDialogOpen}
        onOpenChange={(o) => { setAddDialogOpen(o); if (!o) setNewEventDraft(null); }}
        onSave={handleSaveNewEvent}
        onDelete={() => { setAddDialogOpen(false); setNewEventDraft(null); }}
        timeFormat={timeFormat}
        startInEdit
      />
    </div>
  );
}
