import { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { CyclingData } from '../types';
import { COUNTERS, COUNTER_IDS } from '../types';
import { formatNumber, formatPct } from '../utils/calculations';
import YearComparisonChart from '../components/Dashboard/YearComparisonChart';

interface Props {
  data: CyclingData;
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ComparisonPage({ data }: Props) {
  const [selectedCounter, setSelectedCounter] = useState(COUNTER_IDS[0]);

  // Radar data: normalize by max value per metric
  const radarMetrics = ['Total 2024', 'Moy. journalière', 'Pic journalier', 'Total 2023'];
  const radarValues = {
    'Total 2024': COUNTER_IDS.map((id) => data.stats[id]?.total_2024 ?? 0),
    'Moy. journalière': COUNTER_IDS.map((id) => data.stats[id]?.daily_avg_2024 ?? 0),
    'Pic journalier': COUNTER_IDS.map((id) => data.stats[id]?.peak_value_2024 ?? 0),
    'Total 2023': COUNTER_IDS.map((id) => data.stats[id]?.total_2023 ?? 0),
  };

  const radarData = radarMetrics.map((metric) => {
    const vals = radarValues[metric as keyof typeof radarValues];
    const max = Math.max(...vals, 1);
    const entry: Record<string, number | string> = { metric };
    COUNTER_IDS.forEach((id, i) => {
      entry[id] = Math.round((vals[i] / max) * 100);
    });
    return entry;
  });

  // Share-of-total bar chart
  const shareData = COUNTER_IDS.map((id) => {
    const stats = data.stats[id];
    const total = COUNTER_IDS.reduce((acc, i) => acc + (data.stats[i]?.total_2024 ?? 0), 0);
    return {
      name: COUNTERS[id].shortName,
      part: total > 0 ? Math.round(((stats?.total_2024 ?? 0) / total) * 100) : 0,
      color: COUNTERS[id].color,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Comparaison des compteurs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Analyse comparative des 3 accès cyclistes au Parc Jean-Drapeau
        </p>
      </div>

      {/* Stats table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Indicateurs clés par compteur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Compteur</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Total 2023</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Total 2024</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Évol. YoY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Moy. jour. 2024</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Pic 2024</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Part du total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {COUNTER_IDS.map((id) => {
                const stats = data.stats[id];
                const share = shareData.find((s) => s.name === COUNTERS[id].shortName);
                return (
                  <tr key={id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COUNTERS[id].color }} />
                        <span className="font-medium text-slate-800">{COUNTERS[id].name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(stats?.total_2023 ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatNumber(stats?.total_2024 ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${(stats?.yoy_change_pct ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatPct(stats?.yoy_change_pct ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(stats?.daily_avg_2024 ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(stats?.peak_value_2024 ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${share?.part ?? 0}%`, backgroundColor: COUNTERS[id].color }}
                          />
                        </div>
                        <span className="text-slate-600 w-8 text-right">{share?.part ?? 0} %</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radar + Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Profil comparatif (normalisé)</h2>
          <p className="text-xs text-slate-500 mb-4">Chaque axe normalisé à 100 = valeur maximale parmi les 3 compteurs</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
              {COUNTER_IDS.map((id) => (
                <Radar
                  key={id}
                  name={COUNTERS[id].shortName}
                  dataKey={id}
                  stroke={COUNTERS[id].color}
                  fill={COUNTERS[id].color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Tooltip
                formatter={(v: number, name: string) => [`${v} /100`, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Part du total */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Part du flux cycliste total 2024</h2>
          <p className="text-xs text-slate-500 mb-4">% des passages totaux captés par chaque compteur</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={shareData} layout="vertical" margin={{ left: 60, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} %`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v: number) => [`${v} %`, 'Part du total']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="part" radius={[0, 4, 4, 0]}>
                {shareData.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-over-year per counter */}
      <div>
        <div className="flex gap-2 mb-4">
          {COUNTER_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedCounter(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                selectedCounter === id
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={selectedCounter === id ? { backgroundColor: COUNTERS[id].color, borderColor: COUNTERS[id].color } : {}}
            >
              {COUNTERS[id].shortName}
            </button>
          ))}
        </div>
        <YearComparisonChart monthly={data.monthly} counterId={selectedCounter} />
      </div>
    </div>
  );
}
