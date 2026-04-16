import type React from 'react';
import { SessionGuard } from '@/components/auth/session-guard';
import { AdminSidebar, AdminSidebarMobile } from './admin-sidebar';
import type { AdminSidebarItemKey } from './admin-sidebar';

type AdminDashboardShellProps = {
  activeItem: AdminSidebarItemKey;
  children: React.ReactNode;
};

export function AdminDashboardShell({ activeItem, children }: AdminDashboardShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="admin" />
      <AdminSidebarMobile activeItem={activeItem} />
      <div className="hidden lg:block">
        <AdminSidebar activeItem={activeItem} />
      </div>

      <main className="flex-1 overflow-y-auto bg-[#f1f3f8]">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
