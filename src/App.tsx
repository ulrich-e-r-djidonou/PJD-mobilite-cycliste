import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useData } from './hooks/useData';
import Header from './components/Layout/Header';
import OverviewPage from './pages/OverviewPage';
import SeasonalityPage from './pages/SeasonalityPage';
import ComparisonPage from './pages/ComparisonPage';

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Chargement des données…</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <h2 className="font-semibold text-red-800 mb-2">Données non disponibles</h2>
        <p className="text-sm text-red-600 mb-4">
          Le fichier <code className="bg-red-100 px-1 rounded">public/data/cycling_data.json</code> est introuvable.
        </p>
        <div className="bg-slate-900 rounded-lg p-3 text-left text-xs text-green-400 font-mono">
          <div className="text-slate-400 mb-1"># Générer les données :</div>
          <div>cd scripts</div>
          <div>pip install pandas</div>
          <div>python prepare_data.py</div>
        </div>
        {message && (
          <p className="text-xs text-slate-400 mt-3">Erreur : {message}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { data, loading, error } = useData();

  if (loading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={error ?? 'Données manquantes'} />;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<OverviewPage data={data} />} />
            <Route path="/saisonnalite" element={<SeasonalityPage data={data} />} />
            <Route path="/comparaison" element={<ComparisonPage data={data} />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 bg-white mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Source : <a href="https://donnees.montreal.ca/dataset/velos-comptage" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Données ouvertes — Ville de Montréal</a>
            </span>
            <span>Compteurs : Pont Jacques-Cartier · Pierre-Dupuy · Notre-Dame</span>
            <span>Période : 2023–2024</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
