'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BarChart3, Calendar, CreditCard, MessageSquare, Search, Shield, Users, AlertTriangle, Menu, X } from 'lucide-react';
import type React from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { SessionGuard } from '@/components/auth/session-guard';
import type { AdminSidebarItemKey } from './admin-sidebar';
import { cn } from '@/lib/utils';

type AdminDashboardShellProps = {
  activeItem: AdminSidebarItemKey;
  children: React.ReactNode;
};

const navItems: Array<{
  key: AdminSidebarItemKey;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'users', href: '/admin/users', label: 'Users', icon: Users },
  { key: 'approvals', href: '/admin/approvals', label: 'Approvals', icon: Shield },
  { key: 'bookings', href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { key: 'quotes', href: '/admin/quotes', label: 'Quotes', icon: MessageSquare },
  { key: 'payments', href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { key: 'complaints', href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
];

export function AdminDashboardShell({ activeItem, children }: AdminDashboardShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecf4ff_0%,#dfe7f5_52%)] px-2 py-2 sm:px-3 sm:py-3">
      <SessionGuard requiredRole="admin" />
      <div className="w-full h-[calc(100vh-1rem)] overflow-hidden rounded-xl border border-[#cddbef] bg-[linear-gradient(180deg,#edf3fd_0%,#e8f0fb_100%)] shadow-[0_16px_42px_rgba(38,67,122,0.16)] sm:h-[calc(100vh-1.5rem)]">
        <main className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f4f7fd_0%,#edf2f9_100%)]">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d4def0] bg-white text-slate-700 shadow-md md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {mobileMenuOpen ? (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-900/45 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="fixed inset-y-0 right-0 z-50 w-[280px] border-l border-[#dbe5f4] bg-white p-4 shadow-2xl md:hidden">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === activeItem;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'inline-flex h-10 w-full items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition',
                          isActive
                            ? 'bg-[#1e83f6] text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
                            : 'text-slate-700 hover:bg-[#edf4ff]'
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
                    className="inline-flex h-10 w-full items-center justify-start gap-2 rounded-full px-3.5 text-[13px] font-medium text-slate-700 transition hover:bg-[#edf4ff]"
                  />
                </div>
              </aside>
            </>
          ) : null}

          <div className="sticky top-0 z-30 shrink-0">
          <header className="hidden border-b border-[#dbe5f4] bg-[#f8fbff] px-3 py-2 sm:px-4 sm:py-2.5 md:block">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="hidden h-[62px] w-[320px] shrink-0 overflow-hidden rounded-xl bg-white p-0.5 shadow-sm sm:flex">
                <img src="/wrectifai_logo_cropped.png?v=4" alt="WrectifAI" className="h-full w-full object-contain" />
              </div>
              <div className="relative w-full max-w-[520px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search admin pages..."
                  className="h-[38px] w-full rounded-xl border border-[#d6e0f0] bg-white pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none"
                />
              </div>
            </div>
          </header>

          <nav className="hidden overflow-x-auto bg-[linear-gradient(180deg,#0e4ca2_0%,#0a3779_100%)] px-2 py-2 sm:px-4 md:block">
            <div className="flex min-w-max items-center gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === activeItem;
                return (
                  <Link
                    key={item.key}
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
          </div>

          <section className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 md:p-4">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </section>
        </main>
      </div>
    </div>
  );
}
