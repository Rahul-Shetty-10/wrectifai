'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDiagnoseConfig,
  type DiagnoseConfig,
  type IssueCategoryConfig,
  type ResultSummaryItem,
  type NextStep,
  type TrustItem,
} from '@/lib/diagnosis-api';

// Simple in-memory cache
let cachedConfig: DiagnoseConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseDiagnoseConfigReturn {
  categories: IssueCategoryConfig[];
  resultSummaries: ResultSummaryItem[];
  nextSteps: NextStep[];
  trustItems: TrustItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDiagnoseConfig(): UseDiagnoseConfigReturn {
  const [config, setConfig] = useState<DiagnoseConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache
      if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
        setConfig(cachedConfig);
        setLoading(false);
        return;
      }

      const data = await getDiagnoseConfig();
      cachedConfig = data;
      cacheTimestamp = Date.now();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagnose config');
      console.error('Failed to fetch diagnose config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchConfig();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchConfig]);

  return {
    categories: config?.categories ?? [],
    resultSummaries: config?.resultSummaries ?? [],
    nextSteps: config?.nextSteps ?? [],
    trustItems: config?.trustItems ?? [],
    loading,
    error,
    refetch: fetchConfig,
  };
}

// Hook for fetching a single category
interface UseDiagnoseCategoryReturn {
  category: IssueCategoryConfig | null;
  loading: boolean;
  error: string | null;
}

export function useDiagnoseCategory(categoryId: string | null): UseDiagnoseCategoryReturn {
  const [category, setCategory] = useState<IssueCategoryConfig | null>(null);
  const [loading, setLoading] = useState(!!categoryId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      Promise.resolve().then(() => {
        setCategory((prev) => (prev !== null ? null : prev));
        setLoading((prev) => (prev !== false ? false : prev));
      });
      return;
    }

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have it in the full config cache
        if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
          const found = cachedConfig.categories.find((c) => c.id === categoryId);
          if (found) {
            setCategory(found);
            setLoading(false);
            return;
          }
        }

        const { getDiagnoseCategory } = await import('@/lib/diagnosis-api');
        const data = await getDiagnoseCategory(categoryId);
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
        console.error('Failed to fetch category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  return { category, loading, error };
}
