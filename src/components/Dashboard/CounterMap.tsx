import type { CounterMeta } from '../../types';
import { COUNTERS } from '../../types';

interface Props {
  counters: CounterMeta[];
}

// Simple SVG map placeholder showing approximate positions relative to PJD
export default function CounterMap({ counters }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">Localisation des compteurs</h2>
        <p className="text-xs text-slate-500">Accès cyclistes vers le Parc Jean-Drapeau</p>
      </div>
      <div className="space-y-3">
        {counters.map((c) => {
          const meta = COUNTERS[c.id as keyof typeof COUNTERS];
          return (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta?.color ?? '#6b7280' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{c.name}</div>
                <div className="text-xs text-slate-400">
                  {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.status === 'Actif'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {c.status}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
        <p className="text-xs text-teal-700 leading-relaxed">
          <strong>Parc Jean-Drapeau</strong> (Île Sainte-Hélène &amp; Notre-Dame) est accessible
          via le pont Jacques-Cartier, la voie Pierre-Dupuy, et la rue Notre-Dame Est.
        </p>
      </div>
    </div>
  );
}
