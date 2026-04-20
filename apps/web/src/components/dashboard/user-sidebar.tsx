'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  CarFront,
  ChevronLeft,
  ChevronRight,
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
  isMobile?: boolean;
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

export function UserSidebar({ activeItem, content, isMobile = false }: UserSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Force expanded state on mobile
  const effectiveCollapsed = isMobile ? false : isCollapsed;
  const logoSrc = effectiveCollapsed ? '/favicon.ico' : '/wrectifai_logo_cropped.png?v=2';

  return (
    <aside
      className={cn(
        "flex h-screen flex-col overflow-hidden border-r border-[#e4eaf4] bg-white text-slate-900 shadow-ambient transition-all duration-300 ease-in-out",
        effectiveCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center justify-center border-b border-[#e7edf6] px-3 py-4 transition-all duration-300",
        effectiveCollapsed ? "h-0 opacity-0 py-0 border-none pointer-events-none" : "h-32 opacity-100"
      )}>
        <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-white p-2">
          <img
            src={logoSrc}
            alt={content.brandName}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-x-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeItem;

          return (
            <Button
              asChild
              key={item.key}
              variant="ghost"
              className={cn(
                'h-auto w-full rounded-md px-3.5 py-3 text-left text-[15px] font-medium transition-all duration-300',
                effectiveCollapsed ? "justify-center" : "justify-start gap-3.5",
                active
                  ? 'bg-[#eaf3ff] text-[#0f62d6] ring-1 ring-[#b9d4fb]'
                  : 'text-slate-600 hover:bg-[#f4f8ff] hover:text-[#0f62d6]'
              )}
            >
              <Link href={item.href}>
                <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-[#0f62d6]' : 'text-slate-400')} />
                {!effectiveCollapsed && (
                  <span className="whitespace-nowrap transition-opacity duration-200">
                    {content.nav[item.key] || navLabelFallback[item.key]}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 p-4 border-t border-[#e7edf6]">
        <LogoutButton
          variant="ghost"
          withIcon
          hideLabel={effectiveCollapsed}
          className={cn(
            "h-auto w-full rounded-md px-3.5 py-3 text-left text-[15px] font-medium text-slate-600 transition-all duration-300 hover:bg-[#f4f8ff] hover:text-[#0f62d6]",
            effectiveCollapsed ? "justify-center" : "justify-start gap-3.5"
          )}
        />
        
        {/* Collapse Toggle Button - Always hidden on mobile drawer */}
        {!isMobile && (
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "mt-1 h-10 w-full rounded-xl bg-[#f0f4f9] text-slate-500 hover:bg-[#e4ebf3] hover:text-[#0f62d6] transition-all duration-300 hidden lg:flex items-center justify-center",
              effectiveCollapsed ? "px-0" : "px-4"
            )}
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
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
              <UserSidebar activeItem={activeItem} content={content} isMobile={true} />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
