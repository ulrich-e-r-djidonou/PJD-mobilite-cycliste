interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number; // % change, positive = up
  accent?: string; // tailwind color class for border
}

export default function KpiCard({ label, value, sub, trend, accent = 'border-teal-500' }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${accent} p-5`}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)} % vs 2023
        </div>
      )}
    </div>
  );
}
