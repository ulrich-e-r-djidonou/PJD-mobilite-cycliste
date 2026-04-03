import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { MonthlyRecord } from '../../types';
import { COUNTERS, COUNTER_IDS, MONTHS_SHORT_FR } from '../../types';

interface Props {
  monthly: MonthlyRecord[];
}

export default function SeasonalityChart({ monthly }: Props) {
  // Build a flat array: for each month 1-12, total across both years
  const data = MONTHS_SHORT_FR.map((label, i) => {
    const month = i + 1;
    const rows = monthly.filter((r) => r.month === month);
    const entry: Record<string, number | string> = { month: label };
    for (const id of COUNTER_IDS) {
      const avg = rows.length
        ? rows.reduce((acc, r) => acc + (Number(r[id]) || 0), 0) / rows.length
        : 0;
      entry[id] = Math.round(avg);
    }
    return entry;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">Profil saisonnier</h2>
        <p className="text-xs text-slate-500">Moyenne mensuelle des passages (2023–2024 combinés)</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
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
            formatter={(value, name) => [
              new Intl.NumberFormat('fr-CA').format(Number(value)),
              COUNTERS[name as keyof typeof COUNTERS]?.shortName ?? String(name),
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Legend
            formatter={(value) => COUNTERS[value as keyof typeof COUNTERS]?.shortName ?? value}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          {COUNTER_IDS.map((id) => (
            <Bar key={id} dataKey={id} fill={COUNTERS[id].color} radius={[3, 3, 0, 0]} maxBarSize={32} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
