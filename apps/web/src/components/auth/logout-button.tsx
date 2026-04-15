'use client';

import { useRouter } from 'next/navigation';
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
};

export function LogoutButton({
  className,
  variant = 'secondary',
  withIcon = false,
  label = 'Logout',
}: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  }

  return (
    <Button variant={variant} onClick={logout} className={cn(className)}>
      {withIcon ? <LogOut className="h-4 w-4 shrink-0" /> : null}
      {label}
    </Button>
  );
}
