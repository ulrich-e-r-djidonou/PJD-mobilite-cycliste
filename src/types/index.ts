export interface CounterMeta {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: string;
  year_installed: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  [counterId: string]: number | string;
}

export interface MonthlyRecord {
  year: number;
  month: number;
  month_label: string; // "Jan 2023"
  [counterId: string]: number | string;
}

export interface WeeklyRecord {
  year: number;
  week: number;
  week_label: string;
  [counterId: string]: number | string;
}

export interface CounterStats {
  name: string;
  total_2023: number;
  total_2024: number;
  daily_avg_2023: number;
  daily_avg_2024: number;
  peak_date_2023: string;
  peak_value_2023: number;
  peak_date_2024: string;
  peak_value_2024: number;
  yoy_change_pct: number; // % change 2023→2024
}

export interface CyclingData {
  metadata: {
    generated_at: string;
    period: string;
    source: string;
    counters: CounterMeta[];
  };
  daily: DailyRecord[];
  monthly: MonthlyRecord[];
  weekly: WeeklyRecord[];
  stats: Record<string, CounterStats>;
}

export type CounterId = '100002880' | '100003040' | '100001753';

export const COUNTERS: Record<CounterId, { name: string; shortName: string; color: string }> = {
  '100002880': { name: 'Pont Jacques-Cartier', shortName: 'Jacques-Cartier', color: '#0ea5e9' },
  '100003040': { name: 'Pierre-Dupuy', shortName: 'Pierre-Dupuy', color: '#10b981' },
  '100001753': { name: 'Notre-Dame', shortName: 'Notre-Dame', color: '#f59e0b' },
};

export const COUNTER_IDS: CounterId[] = ['100002880', '100003040', '100001753'];

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const MONTHS_SHORT_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];
