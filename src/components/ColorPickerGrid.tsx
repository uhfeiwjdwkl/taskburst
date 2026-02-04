import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Edit2 } from 'lucide-react';
import { PRESET_COLORS } from '@/types/settings';

interface ColorPickerGridProps {
  value: string;
  onChange: (color: string) => void;
  customColors?: string[];
  onAddCustomColor?: (color: string) => void;
  onEditCustomColor?: (oldColor: string, newColor: string) => void;
  onDeleteCustomColor?: (color: string) => void;
  showCustomInput?: boolean;
}

export const ColorPickerGrid = ({
  value,
  onChange,
  customColors = [],
  onAddCustomColor,
  onEditCustomColor,
  onDeleteCustomColor,
  showCustomInput = true,
}: ColorPickerGridProps) => {
  const [customColor, setCustomColor] = useState('#6366f1');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [editColor, setEditColor] = useState('#6366f1');

  const allColors = [...customColors, ...PRESET_COLORS];

  const handleAddCustom = () => {
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      onAddCustomColor?.(customColor);
      onChange(customColor);
      setIsAddingCustom(false);
    }
  };

  const handleEditCustom = (oldColor: string) => {
    if (editColor && /^#[0-9A-Fa-f]{6}$/.test(editColor)) {
      onEditCustomColor?.(oldColor, editColor);
      if (value === oldColor) {
        onChange(editColor);
      }
      setEditingColor(null);
    }
  };

  const handleDeleteCustom = (color: string) => {
    onDeleteCustomColor?.(color);
    if (value === color) {
      onChange(PRESET_COLORS[0]);
    }
    setEditingColor(null);
  };

  const isCustomColor = (color: string) => customColors.includes(color);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2">
        {allColors.map((color) => (
          <div key={color} className="relative group">
            <button
              onClick={() => onChange(color)}
              className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                value === color ? 'border-foreground ring-2 ring-primary/50' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
            
            {/* Edit/delete actions for custom colors */}
            {isCustomColor(color) && onEditCustomColor && onDeleteCustomColor && (
              <Popover open={editingColor === color} onOpenChange={(open) => {
                if (open) {
                  setEditingColor(color);
                  setEditColor(color);
                } else {
                  setEditingColor(null);
                }
              }}>
                <PopoverTrigger asChild>
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-background border border-border rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Edit color"
                  >
                    <Edit2 className="h-2 w-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3" align="start">
                  <div className="space-y-3">
                    <p className="text-xs font-medium">Edit Custom Color</p>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 h-7" 
                        onClick={() => handleEditCustom(color)}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="h-7 px-2" 
                        onClick={() => handleDeleteCustom(color)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
        
        {showCustomInput && onAddCustomColor && (
          <Popover open={isAddingCustom} onOpenChange={setIsAddingCustom}>
            <PopoverTrigger asChild>
              <button
                className="w-8 h-8 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center hover:border-foreground transition-colors"
                title="Add custom color"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 h-8 text-xs"
                  />
                </div>
                <Button size="sm" className="w-full h-7" onClick={handleAddCustom}>
                  Add Color
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* Selected color preview */}
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  );
};
