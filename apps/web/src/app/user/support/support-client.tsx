'use client';

import { useEffect, useState } from 'react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createSupportTicket,
  fetchSupportTickets,
  type SupportTicket,
  type UserSupportContent,
  type UserSidebarContent,
} from '@/lib/api';

type Props = { sidebar: UserSidebarContent; content: UserSupportContent };

export function SupportClient({ sidebar, content }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTickets() {
    try {
      const data = await fetchSupportTickets();
      setTickets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.loadTicketsErrorLabel);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function onCreate() {
    if (!subject.trim() || !description.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await createSupportTicket({ subject: subject.trim(), description: description.trim() });
      setSubject('');
      setDescription('');
      await loadTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : content.createTicketErrorLabel);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="support" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="support" content={sidebar} />
      </div>
      <section className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6">
          <UserTopLogoHeader sidebar={sidebar} />
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{content.createTicketTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={content.subjectPlaceholder} />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={content.descriptionPlaceholder}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button onClick={onCreate} disabled={saving || !subject.trim() || !description.trim()}>
                {saving ? content.submittingLabel : content.submitLabel}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{content.myTicketsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">{content.loadingTicketsLabel}</p> : null}
              {!loading && tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">{content.noTicketsLabel}</p>
              ) : null}
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs uppercase text-muted-foreground">{ticket.status}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
