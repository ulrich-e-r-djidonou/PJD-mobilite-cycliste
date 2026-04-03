import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import type { DailyRecord } from '../../types';
import { COUNTERS, COUNTER_IDS } from '../../types';

interface Props {
  daily: DailyRecord[];
  year: number;
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function TimeSeriesChart({ daily, year }: Props) {
  const filtered = daily.filter((d) => d.date.startsWith(String(year)));

  // Smooth: 7-day rolling average
  const smoothed = filtered.map((d, i) => {
    const window = filtered.slice(Math.max(0, i - 3), Math.min(filtered.length, i + 4));
    const avg: Record<string, number | string> = { date: d.date };
    for (const id of COUNTER_IDS) {
      const vals = window.map((w) => Number(w[id]) || 0);
      avg[id] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return avg;
  });

  const formatXAxis = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (d.getDate() === 1) return MONTHS_SHORT[d.getMonth()];
    return '';
  };

  const formatTooltipDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Passages quotidiens</h2>
          <p className="text-xs text-slate-500">Moyenne glissante sur 7 jours — {year}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={smoothed} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
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
            labelFormatter={formatTooltipDate}
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat('fr-CA').format(value),
              COUNTERS[name as keyof typeof COUNTERS]?.shortName ?? name,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Legend
            formatter={(value) => COUNTERS[value as keyof typeof COUNTERS]?.shortName ?? value}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          {COUNTER_IDS.map((id) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={COUNTERS[id].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          <Brush
            dataKey="date"
            height={20}
            tickFormatter={formatXAxis}
            stroke="#e2e8f0"
            fill="#f8fafc"
            travellerWidth={6}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
