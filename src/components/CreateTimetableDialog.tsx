import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timetable, TimeSlot } from "@/types/timetable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CreateTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (timetable: Timetable) => void;
}

export function CreateTimetableDialog({ open, onOpenChange, onCreate }: CreateTimetableDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<'weekly' | 'fortnightly'>('weekly');
  const [mode, setMode] = useState<'rigid' | 'flexible'>('rigid');
  const [fieldsPerCell, setFieldsPerCell] = useState<1 | 2 | 3>(1);
  const [fortnightStartDate, setFortnightStartDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', label: '', startTime: '09:00', duration: 60 }
  ]);

  // Flexible mode settings
  const [flexStartTime, setFlexStartTime] = useState('06:00');
  const [flexEndTime, setFlexEndTime] = useState('22:00');
  const [flexInterval, setFlexInterval] = useState(60); // minutes between time markings

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedDays, setSelectedDays] = useState<string[]>([...allDays]);

  const generateLabel = (startTime: string) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      label: '',
      startTime: '',
      duration: 60
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRemoveTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    }
  };

  const handleUpdateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots(timeSlots.map(slot => {
      if (slot.id === id) {
        const updated = { ...slot, [field]: value };
        return updated;
      }
      return slot;
    }));
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a timetable name");
      return;
    }

    // Validation differs by mode
    if (mode === 'rigid' && timeSlots.some(s => !s.startTime || !s.duration)) {
      toast.error("Please fill in all time slots");
      return;
    }

    if (type === 'fortnightly' && !fortnightStartDate) {
      toast.error("Please select a week 1 start date");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    // For flexible mode, auto-generate display labels if not set
    const processedSlots = timeSlots.map(slot => ({
      ...slot,
      label: slot.label || generateLabel(slot.startTime)
    }));

    const newTimetable: Timetable = {
      id: Date.now().toString(),
      name: name.trim(),
      favorite: false,
      type,
      mode,
      fortnightStartDate: type === 'fortnightly' ? fortnightStartDate : undefined,
      rows: mode === 'rigid' ? processedSlots : [],
      columns: selectedDays,
      fieldsPerCell,
      cells: {},
      colorKey: {},
      createdAt: new Date().toISOString(),
      // Store flexible mode settings in a way that can be retrieved
      ...(mode === 'flexible' ? {
        flexStartTime,
        flexEndTime,
        flexInterval,
      } : {}),
    };

    onCreate(newTimetable);
    
    // Reset form
    setName("");
    setType('weekly');
    setMode('rigid');
    setFieldsPerCell(1);
    setFortnightStartDate("");
    setTimeSlots([{ id: '1', label: '', startTime: '09:00', duration: 60 }]);
    setSelectedDays([...allDays]);
    setFlexStartTime('06:00');
    setFlexEndTime('22:00');
    setFlexInterval(60);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Timetable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Timetable Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Schedule"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Schedule Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'weekly' | 'fortnightly')}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Timetable Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'rigid' | 'flexible')}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rigid">Rigid (Fixed slots)</SelectItem>
                  <SelectItem value="flexible">Flexible (Scalable events)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'rigid' && (
              <div className="space-y-2">
                <Label htmlFor="fields">Fields Per Cell</Label>
                <Select value={fieldsPerCell.toString()} onValueChange={(v) => setFieldsPerCell(parseInt(v) as 1 | 2 | 3)}>
                  <SelectTrigger id="fields">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Field</SelectItem>
                    <SelectItem value="2">2 Fields</SelectItem>
                    <SelectItem value="3">3 Fields</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {type === 'fortnightly' && (
            <div className="space-y-2">
              <Label htmlFor="startDate">Week 1 Start Date (Monday)</Label>
              <Input
                id="startDate"
                type="date"
                value={fortnightStartDate}
                onChange={(e) => setFortnightStartDate(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Days to Include</Label>
            <div className="grid grid-cols-4 gap-2">
              {allDays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className="text-xs"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Flexible mode time range settings */}
          {mode === 'flexible' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Flexible Timetable Settings</h4>
              <p className="text-sm text-muted-foreground">
                Events can span any time range and will be displayed scaled to their duration.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flexStart">Start Time</Label>
                  <Input
                    id="flexStart"
                    type="time"
                    value={flexStartTime}
                    onChange={(e) => setFlexStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flexEnd">End Time</Label>
                  <Input
                    id="flexEnd"
                    type="time"
                    value={flexEndTime}
                    onChange={(e) => setFlexEndTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flexInterval">Time Interval (min)</Label>
                  <Select value={flexInterval.toString()} onValueChange={(v) => setFlexInterval(parseInt(v))}>
                    <SelectTrigger id="flexInterval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Rigid mode time slots */}
          {mode === 'rigid' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Time Slots</Label>
                <Button size="sm" variant="outline" onClick={handleAddTimeSlot}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {timeSlots.map((slot, index) => (
                  <div key={slot.id} className="flex gap-2 items-start p-2 border rounded">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name (optional)</Label>
                        <Input
                          placeholder="e.g. Lecture, Break"
                          value={slot.label}
                          onChange={(e) => handleUpdateTimeSlot(slot.id, 'label', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Time</Label>
                        <Input
                          type="time"
                          placeholder="Start time"
                          value={slot.startTime}
                          onChange={(e) => handleUpdateTimeSlot(slot.id, 'startTime', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                        <Input
                          type="number"
                          placeholder="Duration"
                          value={slot.duration || ''}
                          onChange={(e) => handleUpdateTimeSlot(slot.id, 'duration', e.target.value)}
                          min="1"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveTimeSlot(slot.id)}
                      disabled={timeSlots.length === 1}
                      className="mt-5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Timetable</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
