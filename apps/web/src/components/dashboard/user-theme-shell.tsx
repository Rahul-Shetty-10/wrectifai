'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  Bell,
  Car,
  Heart,
  History,
  Home,
  Menu,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import type { UserSidebarContent } from '@/lib/api';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';

type ActiveItem =
  | 'dashboard'
  | 'profile'
  | 'my-garage'
  | 'ai-diagnosis'
  | 'quotes-bookings'
  | 'spare-parts'
  | 'payments'
  | 'settings'
  | 'support';

type UserThemeShellProps = {
  activeItem: ActiveItem;
  sidebar: UserSidebarContent;
  children: ReactNode;
};

const navItems: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  key: ActiveItem;
}> = [
  { href: '/user/dashboard', label: 'Home', icon: Home, key: 'dashboard' },
  { href: '/user/ai-diagnosis', label: 'Diagnose', icon: Sparkles, key: 'ai-diagnosis' },
  { href: '/user/my-garage', label: 'My Garages', icon: Car, key: 'my-garage' },
  { href: '/user/quotes-bookings', label: 'Quotes', icon: Menu, key: 'quotes-bookings' },
  { href: '/user/payments', label: 'History', icon: History, key: 'payments' },
];

export function UserThemeShell({ activeItem, sidebar, children }: UserThemeShellProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-[#dfe7f5] px-2 py-2 sm:px-3 sm:py-3 [font-family:Inter,'SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem={activeItem} content={sidebar} />

      <div className="mx-auto w-full min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border border-[#d4deef] bg-[#edf2fb] shadow-[0_12px_36px_rgba(38,67,122,0.14)] sm:min-h-[calc(100vh-1.5rem)]">
        <header className="border-b border-[#dbe5f4] bg-[#f8fbff] px-2.5 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden h-[62px] w-[320px] shrink-0 overflow-hidden rounded-xl bg-white p-0.5 shadow-sm sm:flex">
              <img
                src="/wrectifai_logo_cropped.png?v=4"
                alt={sidebar.brandName}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="relative w-full max-w-[520px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, garages, bookings..."
                className="h-[38px] w-full rounded-xl border border-[#d6e0f0] bg-white pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <IconPill>
                <Bell className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Heart className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Settings className="h-4 w-4" />
              </IconPill>
              <Link href="/user/profile" className="block">
                <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#8db4ff] bg-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <nav className="overflow-x-auto bg-[linear-gradient(180deg,#0e4ca2_0%,#0a3779_100%)] px-2 py-2 sm:px-4">
          <div className="flex min-w-max items-center gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeItem;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition',
                    isActive ? 'bg-[#1e83f6] shadow-[0_8px_20px_rgba(0,0,0,0.25)]' : 'hover:bg-white/15'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <LogoutButton
              withIcon
              label="Logout"
              variant="ghost"
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/15"
            />
          </div>
        </nav>

        <section className="p-2.5 sm:p-3.5 md:p-4">{children}</section>
      </div>
    </main>
  );
}

function IconPill({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border border-[#d7e2f0] bg-white text-slate-600">
      {children}
    </div>
  );
}
