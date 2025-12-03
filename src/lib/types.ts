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

export interface AppSettings {
  theme: Theme;
  currency: Currency;
}

