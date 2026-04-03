import { useState, useEffect } from 'react';
import type { CyclingData } from '../types';

interface UseDataResult {
  data: CyclingData | null;
  loading: boolean;
  error: string | null;
}

export function useData(): UseDataResult {
  const [data, setData] = useState<CyclingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cycling_data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: CyclingData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
