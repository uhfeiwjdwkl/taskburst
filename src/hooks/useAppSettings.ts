import { useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';

const readSettings = (): AppSettings => {
  const saved = localStorage.getItem('appSettings');
  if (!saved) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Reactive access to appSettings (localStorage), updated via:
 * - window 'storage' (other tabs)
 * - window 'appSettingsUpdated' (same tab)
 */
export const useAppSettings = (): AppSettings => {
  const [settings, setSettings] = useState<AppSettings>(() => readSettings());

  useEffect(() => {
    const update = () => setSettings(readSettings());
    window.addEventListener('storage', update);
    window.addEventListener('appSettingsUpdated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('appSettingsUpdated', update);
    };
  }, []);

  return settings;
};
