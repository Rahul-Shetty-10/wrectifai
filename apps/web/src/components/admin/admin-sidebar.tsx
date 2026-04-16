'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  Shield,
  Store,
  Users,
  User,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';

type AdminSidebarProps = {
  activeItem: AdminSidebarItemKey;
};

export type AdminSidebarItemKey =
  | 'dashboard'
  | 'users'
  | 'approvals'
  | 'bookings'
  | 'quotes'
  | 'payments'
  | 'complaints'
  | 'profile';

const navItems: Array<{
  key: AdminSidebarItemKey;
  label: string;
  icon: typeof BarChart3;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'approvals', label: 'Approvals', icon: Shield },
  { key: 'bookings', label: 'Bookings', icon: Calendar },
  { key: 'quotes', label: 'Quotes', icon: MessageSquare },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'complaints', label: 'Complaints', icon: AlertTriangle },
  { key: 'profile', label: 'Profile', icon: User },
];

export function AdminSidebar({ activeItem }: AdminSidebarProps) {
  const logoSrc = '/wrectifai_logo_cropped.png?v=2';

  return (
    <aside
      className="flex h-screen w-72 flex-col overflow-hidden border-r border-[#e4eaf4] bg-white text-slate-900 shadow-ambient"
    >
      <div className="flex items-center justify-center border-b border-[#e7edf6] px-3 py-4">
        <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-white p-2">
          <img
            src={logoSrc}
            alt="WRECTIFAI"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => {
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
                  ? 'bg-[#eaf3ff] text-[#0f62d6] ring-1 ring-[#b9d4fb]'
                  : 'text-slate-600 hover:bg-[#f4f8ff] hover:text-[#0f62d6]'
              )}
            >
              <Link href={`/admin/${item.key}`}>
                <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-[#0f62d6]' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="p-4">
        <LogoutButton
          variant="ghost"
          withIcon
          className="h-auto w-full justify-start gap-3.5 rounded-md px-3.5 py-3 text-left text-[15px] font-medium text-slate-600 transition-colors hover:bg-[#f4f8ff] hover:text-[#0f62d6]"
        />
      </div>
    </aside>
  );
}

export function AdminSidebarMobile({ activeItem }: AdminSidebarProps) {
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
              <AdminSidebar activeItem={activeItem} />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
