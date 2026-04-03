import type { DailyRecord, MonthlyRecord } from '../types';
import { COUNTER_IDS } from '../types';
import type { CounterId } from '../types';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-CA').format(Math.round(n));
}

export function formatPct(n: number, showPlus = true): string {
  const sign = n > 0 && showPlus ? '+' : '';
  return `${sign}${n.toFixed(1)} %`;
}

/** Aggregate daily records for a given year and counter */
export function sumByYear(daily: DailyRecord[], year: number, counterId: string): number {
  return daily
    .filter((d) => d.date.startsWith(String(year)))
    .reduce((acc, d) => acc + (Number(d[counterId]) || 0), 0);
}

/** Total across all 3 PJD counters for a given year */
export function totalPJDByYear(daily: DailyRecord[], year: number): number {
  return COUNTER_IDS.reduce((acc, id) => acc + sumByYear(daily, year, id), 0);
}

/** Monthly totals for a specific year, all counters combined */
export function monthlyTotalAllCounters(monthly: MonthlyRecord[], year: number): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = monthly.find((r) => r.year === year && r.month === i + 1);
    if (!m) return 0;
    return COUNTER_IDS.reduce((acc, id) => acc + (Number(m[id]) || 0), 0);
  });
}

/** Peak day across all counters combined */
export function peakDayAll(daily: DailyRecord[]): { date: string; value: number } {
  let max = { date: '', value: 0 };
  for (const d of daily) {
    const total = COUNTER_IDS.reduce((acc, id) => acc + (Number(d[id]) || 0), 0);
    if (total > max.value) max = { date: d.date, value: total };
  }
  return max;
}

/** Average daily total (non-zero days only) */
export function dailyAvgAll(daily: DailyRecord[], year?: number): number {
  const filtered = year ? daily.filter((d) => d.date.startsWith(String(year))) : daily;
  const nonZero = filtered.filter((d) =>
    COUNTER_IDS.some((id) => Number(d[id]) > 0)
  );
  if (nonZero.length === 0) return 0;
  const total = nonZero.reduce(
    (acc, d) => acc + COUNTER_IDS.reduce((s, id) => s + (Number(d[id]) || 0), 0),
    0
  );
  return total / nonZero.length;
}

/** Seasonal index: ratio of summer (Jun-Aug) avg to winter (Dec-Feb) avg */
export function seasonalIndex(monthly: MonthlyRecord[], counterId: CounterId): number {
  const summer = monthly
    .filter((m) => [6, 7, 8].includes(m.month))
    .map((m) => Number(m[counterId]) || 0);
  const winter = monthly
    .filter((m) => [12, 1, 2].includes(m.month))
    .map((m) => Number(m[counterId]) || 0);
  const avgSummer = summer.length ? summer.reduce((a, b) => a + b, 0) / summer.length : 0;
  const avgWinter = winter.length ? winter.reduce((a, b) => a + b, 0) / winter.length : 0;
  if (avgWinter === 0) return 0;
  return avgSummer / avgWinter;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}
