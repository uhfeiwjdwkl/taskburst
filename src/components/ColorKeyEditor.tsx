import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { PRESET_COLORS } from "@/types/settings";
import { toast } from "sonner";

interface ColorKeyEditorProps {
  colorKey: Record<string, string>;
  onUpdate: (colorKey: Record<string, string>) => void;
  customColors?: string[];
  activeIsolatedColour?: string | null;
  onIsolateColour?: (colour: string | null) => void;
}

export function ColorKeyEditor({ colorKey, onUpdate, customColors = [], activeIsolatedColour = null, onIsolateColour }: ColorKeyEditorProps) {
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [customHex, setCustomHex] = useState('#6366f1');
  const cardRef = useRef<HTMLDivElement>(null);

  // Restore (clear isolation) when clicking outside the editor
  useEffect(() => {
    if (!onIsolateColour || !activeIsolatedColour) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onIsolateColour(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeIsolatedColour, onIsolateColour]);

  const allColors = [...customColors, ...PRESET_COLORS];

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

  const handleRename = (color: string, label: string) => {
    onUpdate({ ...colorKey, [color]: label });
  };

  return (
    <Card className="p-4" ref={cardRef}>
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
          <div className="space-y-2 p-2 border rounded">
            <div className="flex flex-wrap gap-1">
              {allColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                    newColor === color ? 'border-foreground ring-2 ring-primary/50' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={customHex}
                onChange={(e) => { setCustomHex(e.target.value); setNewColor(e.target.value); }}
                className="w-10 h-8 p-0 border-0 cursor-pointer"
                title="Pick custom colour"
              />
              <Input
                type="text"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setNewColor(e.target.value);
                }}
                placeholder="#RRGGBB"
                className="w-24 h-8 text-xs"
              />
              <Input
                placeholder="Label (e.g., Lecture, Lab)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 h-8"
              />
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map(([color, label]) => (
              <div
                key={color}
                className={`flex items-center gap-2 rounded p-1 -m-1 cursor-pointer transition-colors ${
                  activeIsolatedColour === color ? 'bg-muted ring-1 ring-foreground' : 'hover:bg-muted/50'
                }`}
                onClick={() => onIsolateColour?.(activeIsolatedColour === color ? null : color)}
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={label}
                  onChange={(e) => handleRename(color, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Label"
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); handleRemove(color); }}
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
