import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Vue d\'ensemble' },
  { to: '/saisonnalite', label: 'Saisonnalité' },
  { to: '/comparaison', label: 'Comparaison' },
];

export default function Header() {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">Mobilité cycliste</div>
              <div className="text-xs text-slate-400 leading-tight">Parc Jean-Drapeau · 2023–2024</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
