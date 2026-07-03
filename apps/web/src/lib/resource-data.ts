'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4200/api';

type ApiResponse<T> = {
  data?: T;
};

export function getIcon(name: unknown, fallback: unknown): LucideIcon {
  if (typeof name === 'string' && name in Icons) {
    return Icons[name as keyof typeof Icons] as LucideIcon;
  }

  return fallback as LucideIcon;
}

export function hydrateByKey<T extends Record<string, unknown>>(
  incoming: Array<Record<string, unknown>> | undefined,
  fallback: T[],
  key: keyof T
) {
  if (!incoming?.length) {
    return fallback;
  }

  return incoming.map((item) => {
    const lookupKey = String(key);
    const match = fallback.find(
      (fallbackItem) => fallbackItem[key] === item[lookupKey]
    );
    return {
      ...match,
      ...item,
      icon: getIcon(item.icon, match?.icon),
    } as unknown as T;
  });
}

export function useApiResource<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = window.localStorage.getItem('wrectifai_token');

        if (!token) {
          window.location.replace(`/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/${path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          window.localStorage.removeItem('wrectifai_token');
          window.localStorage.removeItem('wrectifai_user');
          window.dispatchEvent(new Event('wrectifai-auth-changed'));
          window.location.replace(`/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`);
          return;
        }

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ApiResponse<T>;

        if (!cancelled && payload.data) {
          setData(payload.data);
        }
      } catch {
        // Keep the existing UI content as a fallback until the API is reachable.
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return data;
}
