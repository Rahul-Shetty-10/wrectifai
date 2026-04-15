import { LogoutButton } from '@/components/auth/logout-button';
import { SessionGuard } from '@/components/auth/session-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTopLogoHeader } from './user-top-logo-header';
import { UserSidebar, UserSidebarMobile, type UserSidebarContent } from './user-sidebar';

export type UserPageUi = {
  kicker: string;
  title: string;
  description: string;
  emptyStateTitle: string;
  emptyStateBody: string;
};

type UserDashboardShellProps = {
  activeItem:
    | 'dashboard'
    | 'profile'
    | 'my-garage'
    | 'ai-diagnosis'
    | 'quotes-bookings'
    | 'spare-parts'
    | 'payments'
    | 'settings'
    | 'support';
  sidebar: UserSidebarContent;
  page: UserPageUi;
};

export function UserDashboardShell({ activeItem, sidebar, page }: UserDashboardShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <div className="flex h-screen">
        <UserSidebarMobile activeItem={activeItem} content={sidebar} />
        <div className="hidden lg:block">
          <UserSidebar activeItem={activeItem} content={sidebar} />
        </div>
        <section className="surface-lowest shadow-ambient flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            <UserTopLogoHeader sidebar={sidebar} />
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {page.kicker}
                </p>
                <h1 className="mt-1 text-4xl font-display font-bold text-foreground">
                  {page.title}
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{page.description}</p>
              </div>
              <LogoutButton />
            </div>

          <Card className="surface-low border border-border/40">
            <CardHeader>
              <CardTitle className="text-xl">{page.emptyStateTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{page.emptyStateBody}</p>
            </CardContent>
          </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
