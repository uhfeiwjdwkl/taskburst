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
  const [fieldsPerCell, setFieldsPerCell] = useState<1 | 2 | 3>(1);
  const [fortnightStartDate, setFortnightStartDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', label: '9:00 AM', startTime: '09:00', duration: 60 }
  ]);

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedDays, setSelectedDays] = useState<string[]>([...allDays]);

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
    setTimeSlots(timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleCreate = () => {
    if (!name.trim() || timeSlots.some(s => !s.label || !s.startTime || !s.duration)) {
      return;
    }

    if (type === 'fortnightly' && !fortnightStartDate) {
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    const newTimetable: Timetable = {
      id: Date.now().toString(),
      name: name.trim(),
      favorite: false,
      type,
      fortnightStartDate: type === 'fortnightly' ? fortnightStartDate : undefined,
      rows: timeSlots,
      columns: selectedDays,
      fieldsPerCell,
      cells: {},
      colorKey: {},
      createdAt: new Date().toISOString()
    };

    onCreate(newTimetable);
    
    // Reset form
    setName("");
    setType('weekly');
    setFieldsPerCell(1);
    setFortnightStartDate("");
    setTimeSlots([{ id: '1', label: '9:00 AM', startTime: '09:00', duration: 60 }]);
    setSelectedDays([...allDays]);
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

          <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Label (e.g., 9:00 AM)"
                      value={slot.label}
                      onChange={(e) => handleUpdateTimeSlot(slot.id, 'label', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        placeholder="Start time"
                        value={slot.startTime}
                        onChange={(e) => handleUpdateTimeSlot(slot.id, 'startTime', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Duration (min)"
                        value={slot.duration || ''}
                        onChange={(e) => handleUpdateTimeSlot(slot.id, 'duration', e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveTimeSlot(slot.id)}
                    disabled={timeSlots.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Timetable</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
