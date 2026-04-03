import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CyclingData } from '../types';
import { COUNTERS, COUNTER_IDS, MONTHS_SHORT_FR } from '../types';
import { seasonalIndex, formatNumber } from '../utils/calculations';
import type { CounterId } from '../types';

interface Props {
  data: CyclingData;
}

export default function SeasonalityPage({ data }: Props) {
  // Build monthly data with both years
  const chartData = MONTHS_SHORT_FR.map((label, i) => {
    const month = i + 1;
    const entry: Record<string, number | string> = { month: label };
    for (const id of COUNTER_IDS) {
      const r2023 = data.monthly.find((r) => r.year === 2023 && r.month === month);
      const r2024 = data.monthly.find((r) => r.year === 2024 && r.month === month);
      entry[`${id}_2023`] = r2023 ? Number(r2023[id]) || 0 : 0;
      entry[`${id}_2024`] = r2024 ? Number(r2024[id]) || 0 : 0;
    }
    return entry;
  });

  // Seasonal indices
  const indices = COUNTER_IDS.map((id) => ({
    id,
    name: COUNTERS[id].shortName,
    color: COUNTERS[id].color,
    index: seasonalIndex(data.monthly, id as CounterId),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analyse de saisonnalité</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Variation saisonnière et comparaison mensuelle par compteur (2023–2024)
        </p>
      </div>

      {/* Seasonal index cards */}
      <div className="grid grid-cols-3 gap-4">
        {indices.map(({ id, name, color, index }) => (
          <div key={id} className="bg-white rounded-xl shadow-sm p-5 border-t-4" style={{ borderColor: color }}>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{name}</div>
            <div className="text-2xl font-bold text-slate-900">×{index.toFixed(1)}</div>
            <div className="text-xs text-slate-500 mt-1">
              Indice saisonnier — ratio été/hiver
            </div>
            <div className="mt-3 text-xs text-slate-600 leading-relaxed">
              {index >= 10
                ? 'Forte saisonnalité — usage quasi exclusivement estival'
                : index >= 4
                ? 'Saisonnalité marquée — pic été bien prononcé'
                : 'Saisonnalité modérée — usage plus régulier'}
            </div>
          </div>
        ))}
      </div>

      {/* Area charts per counter */}
      {COUNTER_IDS.map((id) => {
        const counter = COUNTERS[id];
        const areaData = chartData.map((d) => ({
          month: d.month,
          '2023': d[`${id}_2023`],
          '2024': d[`${id}_2024`],
        }));

        return (
          <div key={id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: counter.color }} />
              <div>
                <h2 className="text-base font-semibold text-slate-800">{counter.name}</h2>
                <p className="text-xs text-slate-500">Passages mensuels 2023 vs 2024</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id={`grad2023_${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`grad2024_${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={counter.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={counter.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  width={36}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name,
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="2023" stroke="#94a3b8" fill={`url(#grad2023_${id})`} strokeWidth={1.5} />
                <Area type="monotone" dataKey="2024" stroke={counter.color} fill={`url(#grad2024_${id})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
