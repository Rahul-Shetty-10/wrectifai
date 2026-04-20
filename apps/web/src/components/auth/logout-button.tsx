'use client';

import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  withIcon?: boolean;
  label?: string;
  hideLabel?: boolean;
};

export function LogoutButton({
  className,
  variant = 'secondary',
  withIcon = false,
  label = 'Logout',
  hideLabel = false,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutEndpoints = useMemo(() => {
    const endpoints = ['/api/auth/logout'];
    const apiLogout = `${API_BASE_URL.replace(/\/+$/, '')}/auth/logout`;
    if (!endpoints.includes(apiLogout)) {
      endpoints.push(apiLogout);
    }
    return endpoints;
  }, []);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    let requestSucceeded = false;
    try {
      for (const endpoint of logoutEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
          });
          if (response.ok) {
            requestSucceeded = true;
            break;
          }
        } catch {
          // Try the next endpoint when network/proxy differs between environments.
        }
      }
    } finally {
      if (requestSucceeded) {
        window.location.href = '/auth/login';
        return;
      }
      setIsLoggingOut(false);
    }
  }

  return (
    <Button variant={variant} onClick={logout} disabled={isLoggingOut} className={cn(className)}>
      {withIcon ? <LogOut className={cn("h-4 w-4 shrink-0", !hideLabel && "mr-0")} /> : null}
      {!hideLabel && (isLoggingOut ? 'Logging out...' : label)}
    </Button>
  );
}
