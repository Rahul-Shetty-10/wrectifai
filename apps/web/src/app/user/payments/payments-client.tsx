'use client';

import { useState, useEffect } from 'react';
import {
  WalletCards,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import type { UserSidebarContent, UserPaymentsContent, PaymentTransaction } from '@/lib/api';
import { fetchPaymentSummary, fetchPaymentTransactions } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PaymentsClient({
  sidebar,
  content,
}: {
  sidebar: UserSidebarContent;
  content: UserPaymentsContent;
}) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [txs, summary] = await Promise.all([
          fetchPaymentTransactions(),
          fetchPaymentSummary(),
        ]);
        setTransactions(txs);
        setTotalSpent(summary.totalSpent);
        setPaidCount(summary.paidCount);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.service.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase())
  );

  const methodUsage = Object.entries(
    transactions.reduce<Record<string, number>>((acc, tx) => {
      const key = (tx.method ?? 'card').toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="payments" content={sidebar} />
      <div className="hidden lg:block border-r border-slate-100 h-full">
        <UserSidebar activeItem="payments" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto w-full relative bg-slate-50/50 h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 min-h-full flex flex-col">
          <UserTopLogoHeader sidebar={sidebar} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none md:text-3xl">
                  {content.header.title}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">{content.header.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label={content.stats.totalSpentLabel} value={`$${totalSpent.toFixed(2)}`} icon={Receipt} color="bg-blue-500" />
            <StatCard
              label={content.stats.outstandingLabel}
              value={transactions.some((t) => t.status === 'pending') ? 'Pending' : '$0.00'}
              icon={AlertCircle}
              color="bg-orange-500"
            />
            <StatCard label={content.stats.creditsLabel} value={`${paidCount}`} icon={CheckCircle2} color="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{content.transactions.title}</h2>
                <div className="relative w-full max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search transactions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-slate-200 bg-white/80 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-8 py-5">{content.transactions.table.date}</th>
                        <th className="px-8 py-5">{content.transactions.table.service}</th>
                        <th className="px-8 py-5">{content.transactions.table.amount}</th>
                        <th className="px-8 py-5 text-right">{content.transactions.table.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-10 text-center">
                            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading transactions...
                            </span>
                          </td>
                        </tr>
                      ) : filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                            <p className="text-slate-400 font-bold uppercase tracking-widest">No matching transactions found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{formatDate(tx.date)}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tx.id.toUpperCase()}</p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-slate-900">{tx.service}</p>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900">${tx.amount.toFixed(2)}</td>
                            <td className="px-8 py-6 text-right">
                              <StatusBadge status={tx.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Showing {filteredTransactions.length} results
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Card className="rounded-[2.5rem] border-none bg-slate-900 p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full translate-x-10 -translate-y-10" />
                <h3 className="text-xs font-black uppercase text-white/30 tracking-[0.2em] mb-6">{content.methods.title}</h3>
                <div className="space-y-4 relative z-10">
                  {methodUsage.length === 0 ? (
                    <p className="text-sm text-white/60">No payment methods used yet.</p>
                  ) : (
                    methodUsage.map(([method, count], idx) => (
                      <div
                        key={method}
                        className={`p-5 rounded-3xl border transition-all ${
                          idx === 0 ? 'bg-white/5 border-primary/40' : 'bg-white/[0.02] border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-white uppercase">{method.replace('_', ' ')}</p>
                          <p className="text-xs font-bold text-white/50">{count} payments</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="rounded-[2.5rem] border-white shadow-xl shadow-slate-200/50 p-8 transition-transform hover:scale-[1.02] cursor-default bg-white">
      <div className="flex items-center gap-4 mb-4">
        <div className={`h-12 w-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tighter md:text-3xl">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10',
    pending: 'bg-orange-500/10 text-orange-600 border-orange-500/10',
    failed: 'bg-destructive/10 text-destructive border-destructive/10',
    refunded: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <Badge className={`rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </Badge>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
