import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FlexibleEvent } from '@/types/timetable';
import { X, Edit, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorPickerGrid } from './ColorPickerGrid';

interface FlexibleEventDetailsDialogProps {
  event: FlexibleEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: FlexibleEvent) => void;
  onDelete: (eventId: string) => void;
  timeFormat?: '12h' | '24h';
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function FlexibleEventDetailsDialog({
  event,
  open,
  onOpenChange,
  onSave,
  onDelete,
  timeFormat = '12h'
}: FlexibleEventDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<FlexibleEvent | null>(null);
  const [customColors, setCustomColors] = useState<string[]>([]);

  // Reset edit state when dialog opens with new event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      setEditedEvent(null);
    }
    onOpenChange(newOpen);
  };

  const startEditing = () => {
    if (event) {
      setEditedEvent({ ...event, fields: event.fields ? [...event.fields] : [] });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editedEvent) {
      onSave(editedEvent);
      setIsEditing(false);
      setEditedEvent(null);
    }
  };

  const handleAddField = () => {
    if (editedEvent) {
      setEditedEvent({
        ...editedEvent,
        fields: [...(editedEvent.fields || []), { label: '', value: '' }]
      });
    }
  };

  const handleRemoveField = (index: number) => {
    if (editedEvent) {
      const newFields = [...editedEvent.fields];
      newFields.splice(index, 1);
      setEditedEvent({ ...editedEvent, fields: newFields });
    }
  };

  const handleUpdateField = (index: number, key: 'label' | 'value', value: string) => {
    if (editedEvent) {
      const newFields = [...editedEvent.fields];
      newFields[index] = { ...newFields[index], [key]: value };
      setEditedEvent({ ...editedEvent, fields: newFields });
    }
  };

  const formatTime = (time: string) => {
    if (timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleAddCustomColor = (color: string) => {
    if (!customColors.includes(color)) {
      setCustomColors([...customColors, color]);
    }
  };

  if (!event) return null;

  const displayEvent = isEditing && editedEvent ? editedEvent : event;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showClose={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{isEditing ? 'Edit Event' : 'Event Details'}</DialogTitle>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={startEditing} className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          {isEditing ? (
            <div>
              <Label>Title</Label>
              <Input
                value={editedEvent?.title || ''}
                onChange={(e) => setEditedEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Event title"
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium text-lg">{displayEvent.title}</p>
            </div>
          )}

          {/* Time */}
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={editedEvent?.startTime || ''}
                  onChange={(e) => setEditedEvent(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={editedEvent?.endTime || ''}
                  onChange={(e) => setEditedEvent(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">
                {formatTime(displayEvent.startTime)} - {formatTime(displayEvent.endTime)}
              </p>
            </div>
          )}

          {/* Color */}
          {isEditing ? (
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditedEvent(prev => prev ? { ...prev, color } : null)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                      editedEvent?.color === color ? 'border-foreground ring-2 ring-offset-2 ring-ring' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                {/* Custom color input */}
                <label className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground cursor-pointer flex items-center justify-center hover:border-foreground transition-colors">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="color"
                    className="sr-only"
                    onChange={(e) => {
                      const color = e.target.value;
                      setEditedEvent(prev => prev ? { ...prev, color } : null);
                      handleAddCustomColor(color);
                    }}
                  />
                </label>
                {customColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditedEvent(prev => prev ? { ...prev, color } : null)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                      editedEvent?.color === color ? 'border-foreground ring-2 ring-offset-2 ring-ring' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  onClick={() => setEditedEvent(prev => prev ? { ...prev, color: undefined } : null)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 bg-muted transition-transform hover:scale-110",
                    !editedEvent?.color ? 'border-foreground ring-2 ring-offset-2 ring-ring' : 'border-transparent'
                  )}
                />
              </div>
            </div>
          ) : displayEvent.color ? (
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: displayEvent.color }} />
              </div>
            </div>
          ) : null}

          {/* Additional Fields */}
          {isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Additional Fields</Label>
                <Button variant="ghost" size="sm" onClick={handleAddField} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {editedEvent?.fields?.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => handleUpdateField(index, 'value', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : displayEvent.fields && displayEvent.fields.length > 0 ? (
            <div className="space-y-2">
              {displayEvent.fields.map((field, index) => (
                <div key={index}>
                  <p className="text-sm text-muted-foreground">{field.label || `Field ${index + 1}`}</p>
                  <p className="font-medium">{field.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Description */}
          {isEditing ? (
            <div>
              <Label>Description (not shown on timetable)</Label>
              <Textarea
                value={editedEvent?.description || ''}
                onChange={(e) => setEditedEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Optional description..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          ) : displayEvent.description ? (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{displayEvent.description}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button variant="destructive" onClick={() => {
                onDelete(event.id);
                handleOpenChange(false);
              }}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditedEvent(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
