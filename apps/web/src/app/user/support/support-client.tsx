'use client';

import { useEffect, useState } from 'react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
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
    <UserThemeShell activeItem="support" sidebar={sidebar}>
      <section className="overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#4ec2ed] sm:h-6" />
            <h1 className="text-[23px] font-semibold tracking-tight text-[#0f2244]">{content.myTicketsTitle}</h1>
          </div>

          <Card className="mb-6 rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">{content.createTicketTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={content.subjectPlaceholder} />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={content.descriptionPlaceholder}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="h-9 rounded-xl bg-[#1976f2] px-4 text-[13px] font-medium text-white hover:bg-[#0d62d4]" onClick={onCreate} disabled={saving || !subject.trim() || !description.trim()}>
                {saving ? content.submittingLabel : content.submitLabel}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">{content.myTicketsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">{content.loadingTicketsLabel}</p> : null}
              {!loading && tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">{content.noTicketsLabel}</p>
              ) : null}
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-[#d9e2ef] bg-[#f9fbff] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-medium text-slate-900">{ticket.subject}</p>
                    <p className="text-xs uppercase text-muted-foreground">{ticket.status}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </UserThemeShell>
  );
}
