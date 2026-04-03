import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { MonthlyRecord } from '../../types';
import { MONTHS_SHORT_FR, COUNTERS } from '../../types';

interface Props {
  monthly: MonthlyRecord[];
  counterId: string;
}

export default function YearComparisonChart({ monthly, counterId }: Props) {
  const data = MONTHS_SHORT_FR.map((label, i) => {
    const month = i + 1;
    const r2023 = monthly.find((r) => r.year === 2023 && r.month === month);
    const r2024 = monthly.find((r) => r.year === 2024 && r.month === month);
    return {
      month: label,
      '2023': r2023 ? Number(r2023[counterId]) || 0 : 0,
      '2024': r2024 ? Number(r2024[counterId]) || 0 : 0,
    };
  });

  const counterName = COUNTERS[counterId as keyof typeof COUNTERS]?.shortName ?? counterId;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">Comparaison annuelle — {counterName}</h2>
        <p className="text-xs text-slate-500">Passages mensuels 2023 vs 2024</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
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
              String(name),
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="2023" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={24} />
          <Bar dataKey="2024" fill="#0ea5e9" radius={[3, 3, 0, 0]} maxBarSize={24} />
          <ReferenceLine y={0} stroke="#e2e8f0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
