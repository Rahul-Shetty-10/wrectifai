'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  Menu,
  UserCircle2,
  WalletCards,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { Button } from '@/components/ui/button';
import type { UserSidebarContent } from '@/lib/api';
import { cn } from '@/lib/utils';
export type { UserSidebarContent };

type SidebarItemKey =
  | 'dashboard'
  | 'profile'
  | 'my-garage'
  | 'ai-diagnosis'
  | 'quotes-bookings'
  | 'spare-parts'
  | 'payments'
  | 'settings'
  | 'support';

type UserSidebarProps = {
  activeItem: SidebarItemKey;
  content: UserSidebarContent;
};

const items: Array<{
  key: SidebarItemKey;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { key: 'my-garage', href: '/user/my-garage', icon: CarFront },
  { key: 'ai-diagnosis', href: '/user/ai-diagnosis', icon: BrainCircuit },
  { key: 'quotes-bookings', href: '/user/quotes-bookings', icon: ClipboardList },
  { key: 'payments', href: '/user/payments', icon: WalletCards },
  { key: 'profile', href: '/user/profile', icon: UserCircle2 },
];

const navLabelFallback: Record<SidebarItemKey, string> = {
  dashboard: 'Dashboard',
  profile: 'Profile',
  'my-garage': 'My Garage',
  'ai-diagnosis': 'AI Diagnosis',
  'quotes-bookings': 'Quotes & Bookings',
  'spare-parts': 'Spare Parts',
  payments: 'Payments',
  settings: 'Settings',
  support: 'Support',
};

export function UserSidebar({ activeItem, content }: UserSidebarProps) {
  const logoSrc = '/wrectifai_logo_cropped.png?v=2';

  return (
    <aside
      className="flex h-screen w-72 flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-ambient"
    >
      <div className="border-b border-white/10 py-4 flex items-center justify-center px-3">
        {content.logoUrl && (
          <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-white p-2">
            <img
              src={logoSrc}
              alt={content.brandName}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeItem;

          return (
            <Button
              asChild
              key={item.key}
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start gap-3.5 rounded-md px-3.5 py-3 text-left text-[15px] font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-white ring-1 ring-blue-300/30'
                  : 'text-blue-100/85 hover:bg-white/5 hover:text-white'
              )}
            >
              <Link href={item.href}>
                <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-blue-200' : 'text-blue-300/80')} />
                <span>{content.nav[item.key] || navLabelFallback[item.key]}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="p-4">
        <LogoutButton
          variant="ghost"
          withIcon
          className="h-auto w-full justify-start gap-3.5 rounded-md px-3.5 py-3 text-left text-[15px] font-medium text-blue-100/85 transition-colors hover:bg-white/5 hover:text-white"
        />
      </div>
    </aside>
  );
}

export function UserSidebarMobile({ activeItem, content }: UserSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 h-10 w-10 lg:hidden border-slate-300 bg-white/95 text-slate-900 shadow-md"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
            <div className="h-full">
              <UserSidebar activeItem={activeItem} content={content} />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
