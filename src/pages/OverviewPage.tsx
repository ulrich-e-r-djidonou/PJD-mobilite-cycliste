import { useState } from 'react';
import type { CyclingData } from '../types';
import { COUNTER_IDS } from '../types';
import KpiCard from '../components/Dashboard/KpiCard';
import TimeSeriesChart from '../components/Dashboard/TimeSeriesChart';
import SeasonalityChart from '../components/Dashboard/SeasonalityChart';
import CounterMap from '../components/Dashboard/CounterMap';
import {
  formatNumber,
  totalPJDByYear,
  dailyAvgAll,
  peakDayAll,
  formatDate,
} from '../utils/calculations';

interface Props {
  data: CyclingData;
}

export default function OverviewPage({ data }: Props) {
  const [year, setYear] = useState<2023 | 2024>(2024);

  const total2023 = totalPJDByYear(data.daily, 2023);
  const total2024 = totalPJDByYear(data.daily, 2024);
  const yoyPct = total2023 > 0 ? ((total2024 - total2023) / total2023) * 100 : 0;
  const dailyAvg = dailyAvgAll(data.daily, year);
  const peak = peakDayAll(data.daily.filter((d) => d.date.startsWith(String(year))));

  // Busiest counter in 2024
  let busiestId = COUNTER_IDS[0];
  let busiestTotal = 0;
  for (const id of COUNTER_IDS) {
    const t = data.stats[id]?.total_2024 ?? 0;
    if (t > busiestTotal) { busiestTotal = t; busiestId = id; }
  }
  const busiestName = data.metadata.counters.find((c) => c.id === busiestId)?.name ?? busiestId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fréquentation cycliste aux 3 accès principaux du Parc Jean-Drapeau
          </p>
        </div>
        {/* Year toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {([2023, 2024] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                year === y
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total annuel (3 accès)"
          value={formatNumber(year === 2024 ? total2024 : total2023)}
          sub={`passages en ${year}`}
          trend={year === 2024 ? yoyPct : undefined}
          accent="border-teal-500"
        />
        <KpiCard
          label="Moyenne journalière"
          value={formatNumber(dailyAvg)}
          sub="passages par jour (jours actifs)"
          accent="border-sky-500"
        />
        <KpiCard
          label="Pic journalier"
          value={formatNumber(peak.value)}
          sub={peak.date ? formatDate(peak.date) : '—'}
          accent="border-amber-500"
        />
        <KpiCard
          label="Accès dominant"
          value={busiestName.split(' ').slice(-1)[0]}
          sub={`${formatNumber(busiestTotal)} passages en 2024`}
          accent="border-emerald-500"
        />
      </div>

      {/* Main chart + map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimeSeriesChart daily={data.daily} year={year} />
        </div>
        <div>
          <CounterMap counters={data.metadata.counters} />
        </div>
      </div>

      {/* Seasonality */}
      <SeasonalityChart monthly={data.monthly} />
    </div>
  );
}
