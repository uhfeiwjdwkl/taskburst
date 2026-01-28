import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AppSettings, DEFAULT_SETTINGS, PageConfig, DEFAULT_PAGES } from '@/types/settings';
import { toast } from 'sonner';
import { Download, Upload, GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  }, [settings.darkMode, settings.brightness]);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
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

    // Update order property
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setSettings({ ...settings, pages: updatedItems });
  };

  const togglePageVisibility = (pageId: string) => {
    const updatedPages = settings.pages.map(page =>
      page.id === pageId ? { ...page, visible: !page.visible } : page
    );
    setSettings({ ...settings, pages: updatedPages });
  };

  const handleSetPin = () => {
    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setSettings({ ...settings, pinProtection: true, pin: newPin });
    setNewPin('');
    setConfirmPin('');
    toast.success('PIN protection enabled');
  };

  const handleRemovePin = () => {
    setSettings({ ...settings, pinProtection: false, pin: undefined });
    toast.success('PIN protection disabled');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure your TaskBurst preferences</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
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
          </div>

          {/* Timer Settings */}
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
                  Require PIN when opening TaskBurst
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
                    placeholder="Enter new PIN"
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};