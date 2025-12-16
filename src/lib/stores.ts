import { writable, derived, get } from 'svelte/store';
import type { Calendar, AppSettings, DayData } from './types';
import { isTMA, telegramTheme } from './telegram';

// New key to start fresh without demo data
const STORAGE_KEY_CALENDARS = 'pnl_calendars_v4';
const STORAGE_KEY_SETTINGS = 'pnl_settings';

const defaultCalendars: Calendar[] = [
  { id: 'main', name: 'General', data: {} }
];

const defaultSettings: AppSettings = {
  theme: 'dark', // User prefers dark theme
  currency: 'USD',
  widgetVisibility: {
    allTime: true,
    lastYear: false,
    thisYear: false,
    lastMonth: false,
    thisMonth: true,
    lastWeek: false,
    thisWeek: true
  },
  passwordEnabled: false,
  passwordHash: undefined
};

// Helper to safely access localStorage
const getStorage = <T>(key: string, defaultVal: T): T => {
  if (typeof localStorage === 'undefined') return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    const parsed = JSON.parse(stored);
    // Extra validation for calendars to ensure at least main exists
    if (key === STORAGE_KEY_CALENDARS && Array.isArray(parsed) && parsed.length === 0) {
        return defaultVal;
    }
    // Migrate old settings to new format
    if (key === STORAGE_KEY_SETTINGS && parsed) {
      const migrated = {
        ...defaultVal as AppSettings,
        ...parsed,
        widgetVisibility: parsed.widgetVisibility || (defaultVal as AppSettings).widgetVisibility,
        passwordEnabled: parsed.passwordEnabled !== undefined ? parsed.passwordEnabled : (defaultVal as AppSettings).passwordEnabled,
        passwordHash: parsed.passwordHash || (defaultVal as AppSettings).passwordHash
      };
      return migrated as T;
    }
    return parsed;
  } catch {
    return defaultVal;
  }
};

export const calendars = writable<Calendar[]>(getStorage(STORAGE_KEY_CALENDARS, defaultCalendars));
export const settings = writable<AppSettings>(getStorage(STORAGE_KEY_SETTINGS, defaultSettings));

// Subscribe to changes and save to localStorage
calendars.subscribe(val => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(val));
  }
});

// Apply theme to document
const applyTheme = (theme: 'dark' | 'light') => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

settings.subscribe(val => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(val));
    // Apply theme to document (only in web mode, TMA uses Telegram theme)
    if (!get(isTMA)) {
      applyTheme(val.theme);
    }
  }
});

// In TMA mode, sync theme with Telegram
telegramTheme.subscribe(tgTheme => {
  if (tgTheme) {
    applyTheme(tgTheme);
  }
});

// Derived store for Main Calendar logic
export const mainCalendarData = derived(calendars, ($calendars) => {
  if (!$calendars || $calendars.length === 0) return {};
  
  const main = $calendars[0];
  if ($calendars.length <= 1) {
    return main.data || {};
  }

  // Aggregate sum of all other calendars (skip main calendar at index 0)
  const sumData: DayData = {};
  
  // Iterate through all calendars except the main one
  for (let i = 1; i < $calendars.length; i++) {
    const cal = $calendars[i];
    if (!cal || !cal.data) continue;
    
    // Sum values for each date across all calendars
    for (const [date, val] of Object.entries(cal.data)) {
      // Ensure value is a valid number
      const numVal = typeof val === 'number' && !isNaN(val) ? val : 0;
      // Sum values for the same date from different calendars
      if (sumData[date] === undefined) {
        sumData[date] = 0;
      }
      sumData[date] += numVal;
    }
  }
  
  return sumData;
});

// Helper to add a calendar
export const addCalendar = () => {
  calendars.update(cals => {
    return [...cals, {
      id: crypto.randomUUID(),
      name: `Calendar ${cals.length + 1}`,
      data: {}
    }];
  });
};

// Helper to remove a calendar
export const removeCalendar = (id: string) => {
  calendars.update(cals => {
    if (id === 'main') return cals; // Cannot remove main
    return cals.filter(c => c.id !== id);
  });
};

// Helper to update calendar name
export const updateCalendarName = (id: string, name: string) => {
  calendars.update(cals => {
    return cals.map(c => c.id === id ? { ...c, name } : c);
  });
};

// Helper to update cell data
export const updateCell = (calendarId: string, date: string, value: number | null) => {
  calendars.update(cals => {
    return cals.map(c => {
      if (c.id !== calendarId) return c;
      const newData = { ...c.data };
      // Ensure value is a valid number before saving
      if (value === null || isNaN(value) || typeof value !== 'number') {
        delete newData[date];
      } else {
        newData[date] = value;
      }
      return { ...c, data: newData };
    });
  });
};

// Helper to clear all data (reset to defaults)
export const clearAllData = () => {
  calendars.set([{ id: 'main', name: 'General', data: {} }]);
};

// Helper to import calendars data
export const importCalendars = (newCalendars: Calendar[]) => {
  if (newCalendars && newCalendars.length > 0) {
    calendars.set(newCalendars);
  }
};
