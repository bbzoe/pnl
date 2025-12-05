export interface DayData {
  [dateIso: string]: number;
}

export interface Calendar {
  id: string;
  name: string;
  data: DayData;
}

export type Currency = 'USD' | 'BTC' | 'ETH';
export type Theme = 'light' | 'dark';

export interface WidgetVisibility {
  allTime: boolean;
  lastYear: boolean;
  thisYear: boolean;
  lastMonth: boolean;
  thisMonth: boolean;
  lastWeek: boolean;
  thisWeek: boolean;
}

export interface AppSettings {
  theme: Theme;
  currency: Currency;
  widgetVisibility: WidgetVisibility;
  passwordEnabled: boolean;
  passwordHash?: string;
}

