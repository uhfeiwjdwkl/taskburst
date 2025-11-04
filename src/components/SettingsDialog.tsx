import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
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
  }, [settings.darkMode]);

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
        
        // Validate it's settings
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timer Settings</h3>
            
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

            <div className="flex items-center justify-between">
              <Label htmlFor="soundEnabled">Play Sound on Timer End</Label>
              <Switch
                id="soundEnabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
              />
            </div>
          </div>

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
