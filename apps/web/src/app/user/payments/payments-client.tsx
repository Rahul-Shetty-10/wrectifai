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
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
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
    <UserThemeShell activeItem="payments" sidebar={sidebar}>
      <section className="relative w-full overflow-y-auto bg-slate-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />

        <div className="mx-auto flex min-h-full max-w-7xl flex-col space-y-8 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[23px] font-semibold text-slate-900 tracking-tight leading-none md:text-[24px]">
                  {content.header.title}
                </h1>
                <p className="mt-2 text-[13px] font-medium text-slate-500">{content.header.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <StatCard label={content.stats.totalSpentLabel} value={`$${totalSpent.toFixed(2)}`} icon={Receipt} color="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard
              label={content.stats.outstandingLabel}
              value={transactions.some((t) => t.status === 'pending') ? 'Pending' : '$0.00'}
              icon={AlertCircle}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard label={content.stats.creditsLabel} value={`${paidCount}`} icon={CheckCircle2} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
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

              <div className="overflow-hidden rounded-xl border border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4 sm:px-8 sm:py-5">{content.transactions.table.date}</th>
                        <th className="px-6 py-4 sm:px-8 sm:py-5">{content.transactions.table.service}</th>
                        <th className="px-6 py-4 sm:px-8 sm:py-5">{content.transactions.table.amount}</th>
                        <th className="px-6 py-4 sm:px-8 sm:py-5 text-right">{content.transactions.table.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 sm:px-8 text-center">
                            <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading transactions...
                            </span>
                          </td>
                        </tr>
                      ) : filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 sm:px-8 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Receipt className="h-12 w-12 text-slate-200" />
                              <p className="text-slate-400 font-semibold uppercase tracking-wider">No matching transactions found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-5 sm:px-8 sm:py-6">
                              <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{formatDate(tx.date)}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tx.id.toUpperCase()}</p>
                            </td>
                            <td className="px-6 py-5 sm:px-8 sm:py-6">
                              <p className="text-sm font-semibold text-slate-900">{tx.service}</p>
                            </td>
                            <td className="px-6 py-5 sm:px-8 sm:py-6 text-sm font-semibold text-slate-900">${tx.amount.toFixed(2)}</td>
                            <td className="px-6 py-5 sm:px-8 sm:py-6 text-right">
                              <StatusBadge status={tx.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/30">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <Card className="relative overflow-hidden rounded-xl border border-[#d9e2ef] bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-[0_8px_20px_rgba(15,23,42,0.18)]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full translate-x-12 -translate-y-12 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-x-8 translate-y-8 blur-2xl" />
                <h3 className="text-xs font-bold uppercase text-white/40 tracking-[0.15em] mb-6 relative z-10">{content.methods.title}</h3>
                <div className="space-y-3 sm:space-y-4 relative z-10">
                  {methodUsage.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <WalletCards className="h-10 w-10 text-white/30" />
                      <p className="text-sm text-white/50">No payment methods used yet.</p>
                    </div>
                  ) : (
                    methodUsage.map(([method, count], idx) => (
                      <div
                        key={method}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          idx === 0 
                            ? 'bg-white/10 border-white/20 backdrop-blur-sm' 
                            : 'bg-white/5 border-white/10 backdrop-blur-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white capitalize">{method.replace('_', ' ')}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/60">{count}</span>
                            <span className="text-xs text-white/40">payment{count !== 1 ? 's' : ''}</span>
                          </div>
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
    </UserThemeShell>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="group relative cursor-default overflow-hidden rounded-xl border border-[#d9e2ef] bg-white p-5 shadow-[0_6px_16px_rgba(94,126,179,0.10)] transition-all duration-300 hover:shadow-[0_10px_24px_rgba(94,126,179,0.14)]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-full translate-x-8 -translate-y-8 opacity-50" />
      <div className="relative z-10 mb-4 flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-white shadow-lg shadow-black/10`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
      </div>
      <p className="relative z-10 text-[24px] font-semibold tracking-tight text-slate-900">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    pending: 'bg-orange-50 text-orange-700 border-orange-200/60',
    failed: 'bg-red-50 text-red-700 border-red-200/60',
    refunded: 'bg-slate-100 text-slate-600 border-slate-200/60',
  };
  return (
    <Badge className={`rounded-lg px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </Badge>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
