import { writable, derived } from 'svelte/store';
import type { Calendar, AppSettings, DayData } from './types';

// Changed key to force refresh with new demo data
const STORAGE_KEY_CALENDARS = 'pnl_calendars_v3';
const STORAGE_KEY_SETTINGS = 'pnl_settings';

// Generate some demo data
const generateDemoData = () => {
  const data: DayData = {};
  // Update to match current simulated date (Dec 2025)
  const months = ['2025-11', '2025-12', '2026-01'];
  
  months.forEach(month => {
    // Generate for 25 days in each month
    for (let i = 1; i <= 28; i++) {
       // Randomly skip some days
       if (Math.random() > 0.7) continue;
       
       const day = i.toString().padStart(2, '0');
       const date = `${month}-${day}`;
       
       // Random value between -500 and 2000
       // Skew towards positive
       let val = Math.floor(Math.random() * 2500) - 500;
       
       // Make some big wins/losses
       if (Math.random() > 0.9) val *= 3;
       
       data[date] = val;
    }
  });
  return data;
};

const defaultCalendars: Calendar[] = [
  { id: 'main', name: 'General', data: {} },
  { id: 'binance', name: 'Binance', data: generateDemoData() },
  { id: 'bybit', name: 'Bybit', data: generateDemoData() },
  { id: 'hyperliquid', name: 'Hyperliquid', data: generateDemoData() }
];

const defaultSettings: AppSettings = {
  theme: 'dark', // User prefers dark theme
  currency: 'USD'
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

settings.subscribe(val => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(val));
    // Apply theme to document
    if (val.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
});

// Derived store for Main Calendar logic
export const mainCalendarData = derived(calendars, ($calendars) => {
  if (!$calendars || $calendars.length === 0) return {};
  
  const main = $calendars[0];
  if ($calendars.length <= 1) {
    return main.data || {};
  }

  // Aggregate sum of all other calendars
  const sumData: DayData = {};
  
  for (let i = 1; i < $calendars.length; i++) {
    const cal = $calendars[i];
    if (!cal || !cal.data) continue;
    
    for (const [date, val] of Object.entries(cal.data)) {
      sumData[date] = (sumData[date] || 0) + val;
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
      if (value === null || isNaN(value)) {
        delete newData[date];
      } else {
        newData[date] = value;
      }
      return { ...c, data: newData };
    });
  });
};
