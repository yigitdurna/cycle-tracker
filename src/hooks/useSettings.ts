import { useState } from 'react';

const STORAGE_KEY = 'cycle-tracker-settings-v1';

interface Settings {
  customCycleLength?: number;
}

function loadSettings(): Settings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return {
    customCycleLength: settings.customCycleLength,
    setCustomCycleLength: (v: number | undefined) =>
      updateSettings({ customCycleLength: v }),
  };
}
