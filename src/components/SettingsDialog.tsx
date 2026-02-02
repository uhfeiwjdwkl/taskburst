import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AppSettings, 
  DEFAULT_SETTINGS, 
  PageConfig, 
  DEFAULT_PAGES,
  TIMEZONE_PRESETS,
  COLOR_THEMES,
  SUBTASK_TEXT_SIZES,
  PROGRESS_GRID_ICONS,
  PRESET_COLORS,
  DateFormat,
  TimeFormat,
  SubtaskTextSize,
} from '@/types/settings';
import { toast } from 'sonner';
import { Download, Upload, GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ProgressGridBox } from './ProgressGridShape';
import { ColorPickerGrid } from './ColorPickerGrid';
import { IconGrid } from './IconGrid';
import { hashPin } from '@/lib/pin';
import { applyColorThemeToDocument } from '@/lib/theme';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all pages exist
        const mergedPages = DEFAULT_PAGES.map(defaultPage => {
          const savedPage = parsed.pages?.find((p: PageConfig) => p.id === defaultPage.id);
          return savedPage || defaultPage;
        });
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, pages: mergedPages });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, [open]);

  useEffect(() => {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply brightness
    document.documentElement.style.filter = `brightness(${settings.brightness / 100})`;

    // Apply theme live while previewing settings
    const theme = COLOR_THEMES.find(t => t.id === settings.colorTheme);
    if (theme) applyColorThemeToDocument(theme.colors);
  }, [settings.darkMode, settings.brightness, settings.colorTheme]);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    window.dispatchEvent(new Event('appSettingsUpdated'));
    toast.success('Settings saved');
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskburst-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        if (typeof imported.darkMode === 'boolean') {
          setSettings({ ...DEFAULT_SETTINGS, ...imported });
          localStorage.setItem('appSettings', JSON.stringify({ ...DEFAULT_SETTINGS, ...imported }));
          window.dispatchEvent(new Event('appSettingsUpdated'));
          toast.success('Settings imported');
        } else {
          toast.error('Invalid settings file');
        }
      } catch (error) {
        toast.error('Failed to import settings');
      }
    };
    input.click();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(settings.pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setSettings({ ...settings, pages: updatedItems });
  };

  const togglePageVisibility = (pageId: string) => {
    const updatedPages = settings.pages.map(page =>
      page.id === pageId ? { ...page, visible: !page.visible } : page
    );
    setSettings({ ...settings, pages: updatedPages });
  };

  const handleSetPin = async () => {
    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    const hash = await hashPin(newPin);
    setSettings({ ...settings, pinProtection: true, pinHash: hash });
    setNewPin('');
    setConfirmPin('');
    toast.success('PIN protection enabled');
  };

  const handleRemovePin = () => {
    setSettings({ ...settings, pinProtection: false, pinHash: undefined });
    toast.success('PIN protection disabled');
  };

  const handleAddCustomColor = (color: string) => {
    if (!settings.customColors.includes(color)) {
      setSettings({ 
        ...settings, 
        customColors: [...settings.customColors, color] 
      });
    }
  };

  const selectedTheme = COLOR_THEMES.find(t => t.id === settings.colorTheme) || COLOR_THEMES[0];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <div>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure your TaskBurst preferences</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Appearance</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <Switch
                  id="darkMode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                />
              </div>

              <div>
                <Label>Brightness: {settings.brightness}%</Label>
                <Slider
                  value={[settings.brightness]}
                  onValueChange={([value]) => setSettings({ ...settings, brightness: value })}
                  min={50}
                  max={150}
                  step={5}
                  className="mt-2"
                />
              </div>

              {/* Color Theme */}
              <div>
                <Label htmlFor="colorTheme">Site Color Theme</Label>
                <Select
                  value={settings.colorTheme}
                  onValueChange={(value) => setSettings({ ...settings, colorTheme: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_THEMES.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                          </div>
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date/Time Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Date & Time</h3>
              
              {/* Timezone */}
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setSettings({ ...settings, timezone: 'custom' });
                    } else {
                      setSettings({ ...settings, timezone: value, customUtcOffset: undefined });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIMEZONE_PRESETS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {settings.timezone === 'custom' && (
                  <div className="mt-2">
                    <Label>Custom UTC Offset (hours)</Label>
                    <Input
                      type="number"
                      min="-12"
                      max="14"
                      step="0.5"
                      value={settings.customUtcOffset ?? 0}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        customUtcOffset: parseFloat(e.target.value) || 0 
                      })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Date Format */}
              <div>
                <Label>Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) => setSettings({ ...settings, dateFormat: value as DateFormat })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</SelectItem>
                    <SelectItem value="MM-DD-YYYY">MM-DD-YYYY (12-31-2024)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Format */}
              <div>
                <Label>Time Format</Label>
                <Select
                  value={settings.timeFormat}
                  onValueChange={(value) => setSettings({ ...settings, timeFormat: value as TimeFormat })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (3:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (15:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress Grid Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Progress Grid</h3>
              
              {/* Icon Selection */}
              <div>
                <Label>Progress Box Shape (Icon)</Label>
                <div className="mt-2 border rounded-md p-2">
                  <IconGrid
                    value={settings.progressGridIcon}
                    onChange={(icon) => setSettings({ ...settings, progressGridIcon: icon })}
                    color={settings.progressGridColor}
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <Label>Progress Box Color</Label>
                <div className="mt-2">
                  <ColorPickerGrid
                    value={settings.progressGridColor}
                    onChange={(color) => setSettings({ ...settings, progressGridColor: color })}
                    customColors={settings.customColors}
                    onAddCustomColor={handleAddCustomColor}
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div className="flex gap-3 mt-2 p-4 bg-muted rounded-md justify-center items-center">
                  <div className="flex flex-col items-center gap-1">
                    <ProgressGridBox
                      icon={settings.progressGridIcon}
                      filled={false}
                      color={settings.progressGridColor}
                      size={32}
                    />
                    <span className="text-xs text-muted-foreground">Empty</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressGridBox
                      icon={settings.progressGridIcon}
                      filled={true}
                      color={settings.progressGridColor}
                      size={32}
                    />
                    <span className="text-xs text-muted-foreground">Filled</span>
                  </div>
                </div>
              </div>

              {/* Per-task settings toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowPerTaskProgressSettings">Allow per-task settings</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable custom shape/color for each task
                  </p>
                </div>
                <Switch
                  id="allowPerTaskProgressSettings"
                  checked={settings.allowPerTaskProgressSettings}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowPerTaskProgressSettings: checked })}
                />
              </div>
            </div>

            {/* Subtask Text Size */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Subtask Progress Boxes</h3>
              <p className="text-sm text-muted-foreground">
                Subtask boxes are always rounded rectangles that stretch to fit text.
              </p>
              
              <div>
                <Label>Text Size in Boxes</Label>
                <Select
                  value={settings.subtaskTextSize}
                  onValueChange={(value) => setSettings({ ...settings, subtaskTextSize: value as SubtaskTextSize })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBTASK_TEXT_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subtask Preview */}
              <div>
                <Label>Subtask Preview</Label>
                <div className="flex gap-3 mt-2 p-4 bg-muted rounded-md justify-center items-center">
                  <div className="flex flex-col items-center gap-1">
                    <ProgressGridBox
                      filled={false}
                      color={settings.progressGridColor}
                      size={28}
                      isSubtask={true}
                      textSize={settings.subtaskTextSize}
                    >
                      AB
                    </ProgressGridBox>
                    <span className="text-xs text-muted-foreground">Incomplete</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressGridBox
                      filled={true}
                      color={settings.progressGridColor}
                      size={28}
                      isSubtask={true}
                      textSize={settings.subtaskTextSize}
                    >
                      AB
                    </ProgressGridBox>
                    <span className="text-xs text-muted-foreground">Complete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Homepage Timetable Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Homepage Timetable Display</h3>
              <p className="text-sm text-muted-foreground">
                Show current timetable block above the Pomodoro timer
              </p>
              
              <div>
                <Label>Display Mode</Label>
                <Select
                  value={settings.homepageTimetableMode}
                  onValueChange={(value: 'none' | 'constant' | 'scheduled') => 
                    setSettings({ ...settings, homepageTimetableMode: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Use favorite timetables)</SelectItem>
                    <SelectItem value="constant">Single timetable</SelectItem>
                    <SelectItem value="scheduled">Scheduled (different by day/time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Timer Settings</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="soundEnabled">Play Sound on Timer End</Label>
                <Switch
                  id="soundEnabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="focusDuration">Focus Duration (minutes)</Label>
                <Input
                  id="focusDuration"
                  type="number"
                  min="1"
                  max="120"
                  value={settings.focusDuration}
                  onChange={(e) => setSettings({ ...settings, focusDuration: parseInt(e.target.value) || 25 })}
                />
              </div>

              <div>
                <Label htmlFor="breakDuration">Short Break Duration (minutes)</Label>
                <Input
                  id="breakDuration"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.breakDuration}
                  onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 5 })}
                />
              </div>

              <div>
                <Label htmlFor="longBreakDuration">Long Break Duration (minutes)</Label>
                <Input
                  id="longBreakDuration"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                />
              </div>

              <div>
                <Label htmlFor="longBreakInterval">Long Break After (sessions)</Label>
                <Input
                  id="longBreakInterval"
                  type="number"
                  min="2"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) => setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) || 4 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Long break occurs after every {settings.longBreakInterval} focus sessions
                </p>
              </div>
            </div>

            {/* Page Visibility & Order */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Navigation Pages</h3>
              <p className="text-sm text-muted-foreground">
                Drag to reorder, click eye icon to show/hide pages
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="useDropdownNav">Always use dropdown navigation</Label>
                <Switch
                  id="useDropdownNav"
                  checked={settings.useDropdownNav}
                  onCheckedChange={(checked) => setSettings({ ...settings, useDropdownNav: checked })}
                />
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="pages">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {settings.pages
                        .sort((a, b) => a.order - b.order)
                        .map((page, index) => (
                          <Draggable key={page.id} draggableId={page.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-2 p-2 border rounded-md bg-background ${
                                  !page.visible ? 'opacity-50' : ''
                                }`}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="flex-1">{page.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => togglePageVisibility(page.id)}
                                >
                                  {page.visible ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* PIN Protection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Security</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>PIN Protection</Label>
                  <p className="text-xs text-muted-foreground">
                    Require PIN when opening TaskBurst (encrypted with bcrypt)
                  </p>
                </div>
                {settings.pinProtection ? (
                  <Button variant="destructive" size="sm" onClick={handleRemovePin}>
                    Remove PIN
                  </Button>
                ) : null}
              </div>

              {!settings.pinProtection && (
                <div className="space-y-2 p-4 border rounded-md">
                  <div>
                    <Label htmlFor="newPin">Set PIN</Label>
                    <Input
                      id="newPin"
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Enter new PIN (min 4 characters)"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Confirm PIN"
                      maxLength={8}
                    />
                  </div>
                  <Button onClick={handleSetPin} size="sm">
                    Enable PIN Protection
                  </Button>
                </div>
              )}
            </div>

            {/* Export/Import */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Export/Import Settings</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
