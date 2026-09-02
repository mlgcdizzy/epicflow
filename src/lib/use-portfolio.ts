'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PortfolioData } from './store';

const EMPTY: PortfolioData = { users: [], teams: [], pillars: [], objectives: [], themes: [], epics: [], dependencies: [] };

export function usePortfolio() {
  const [data, setData] = useState<PortfolioData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load portfolio (${res.status})`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
