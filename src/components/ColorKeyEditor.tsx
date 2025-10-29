import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ColorKeyEditorProps {
  colorKey: Record<string, string>;
  onUpdate: (colorKey: Record<string, string>) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export function ColorKeyEditor({ colorKey, onUpdate }: ColorKeyEditorProps) {
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newLabel.trim()) {
      toast.error("Please enter a label");
      return;
    }

    onUpdate({ ...colorKey, [newColor]: newLabel.trim() });
    setNewLabel("");
    setIsAdding(false);
    toast.success("Color key added");
  };

  const handleRemove = (color: string) => {
    const updated = { ...colorKey };
    delete updated[color];
    onUpdate(updated);
    toast.success("Color key removed");
  };

  const entries = Object.entries(colorKey);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Color Key</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {isAdding && (
          <div className="flex gap-2 items-center p-2 border rounded">
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-24 h-8 rounded border cursor-pointer"
              style={{ backgroundColor: newColor }}
            >
              {PRESET_COLORS.map((color) => (
                <option key={color} value={color} style={{ backgroundColor: color }}>
                  {color}
                </option>
              ))}
            </select>
            <Input
              placeholder="Label (e.g., Lecture, Lab)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        )}

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map(([color, label]) => (
              <div key={color} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-sm">{label}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => handleRemove(color)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No color keys defined</p>
        )}
      </div>
    </Card>
  );
}
