import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  Users,
  Compass,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Filter,
} from 'lucide-react';

export const ReportsPaymentsPage: React.FC = () => {
  const {
    payments,
    requests,
    bids,
    operators,
    contactShares,
    reports,
    adminResolveReport,
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'overview' | 'payments' | 'moderation'>('overview');

  // Key Launch Plan Metrics:
  const totalRevenueKSH = payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0);
  const activePassesCount = operators.filter((o) => o.access_expires_at && new Date(o.access_expires_at).getTime() > Date.now()).length;
  const totalRequests = requests.length;
  const totalBids = bids.length;
  const avgBidsPerRequest = totalRequests > 0 ? (totalBids / totalRequests).toFixed(1) : '0';
  const requestsAtCapacity = requests.filter((r) => bids.filter((b) => b.request_id === r.id).length >= r.slot_limit || r.status === 'locked').length;
  const saturationShare = totalRequests > 0 ? ((requestsAtCapacity / totalRequests) * 100).toFixed(0) : '0';
  const travelersSharedCount = contactShares.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
            Platform Analytics &amp; Revenue
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
            Reports &amp; Daraja Payments
          </h1>
          <p className="text-xs sm:text-sm text-mountain-hostel/80">
            Monitor daily operator pass revenues, marketplace slot saturation, and content moderation queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
            KSH {totalRevenueKSH.toLocaleString()} Total Revenue
          </span>
        </div>
      </div>

      {/* KPI Metric Strip (Tabular Numerals per design constitution) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-desert-atlas/30 space-y-1 shadow-2xs">
          <div className="text-xs text-mountain-hostel/70 font-medium">Daily Pass Revenue</div>
          <div className="text-2xl font-bold text-safari-dusk font-mono tabular-nums">
            KSH {totalRevenueKSH.toLocaleString()}
          </div>
          <div className="text-[11px] text-mountain-hostel/60">Pass KSH 850 / Unlocks KSH 120 - 5,000 · 0% commission</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-desert-atlas/30 space-y-1 shadow-2xs">
          <div className="text-xs text-mountain-hostel/70 font-medium">Active Operator Passes</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {activePassesCount}
          </div>
          <div className="text-[11px] text-mountain-hostel/60">Currently valid 24h passes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-desert-atlas/30 space-y-1 shadow-2xs">
          <div className="text-xs text-mountain-hostel/70 font-medium">Avg Bids / Request</div>
          <div className="text-2xl font-bold text-safari-dusk font-mono tabular-nums">
            {avgBidsPerRequest}
          </div>
          <div className="text-[11px] text-mountain-hostel/60">{totalBids} total submitted quotes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-desert-atlas/30 space-y-1 shadow-2xs">
          <div className="text-xs text-mountain-hostel/70 font-medium">Slot Saturation (30 Cap)</div>
          <div className="text-2xl font-bold text-highlight-accent font-mono tabular-nums">
            {saturationShare}%
          </div>
          <div className="text-[11px] text-mountain-hostel/60">{requestsAtCapacity} requests locked at 30 slots</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-desert-atlas/30 space-y-1 shadow-2xs col-span-2 lg:col-span-1">
          <div className="text-xs text-mountain-hostel/70 font-medium">Traveler Contact Shares</div>
          <div className="text-2xl font-bold text-safari-dusk font-mono tabular-nums">
            {travelersSharedCount}
          </div>
          <div className="text-[11px] text-mountain-hostel/60">Hot leads converted to direct chat</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-desert-atlas-light/80 border border-desert-atlas/30 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview & Categories' },
          { id: 'payments', label: `M-Pesa Ledger (${payments.length})` },
          { id: 'moderation', label: `Moderation & Flagged (${reports.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabLocal(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-mountain-hostel text-white shadow-xs'
                : 'text-mountain-hostel hover:text-safari-dusk'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Category Breakdown */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Split */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-100 pb-2">
              Marketplace Breakdown by Category
            </h2>

            <div className="space-y-4">
              {[
                {
                  cat: 'Safaris & Tours',
                  code: 'safari',
                  count: requests.filter((r) => r.category === 'safari').length,
                  bidsCount: bids.filter((b) => {
                    const r = requests.find((req) => req.id === b.request_id);
                    return r?.category === 'safari';
                  }).length,
                  pct: '60%',
                },
                {
                  cat: 'Hotels & Lodges',
                  code: 'hotel',
                  count: requests.filter((r) => r.category === 'hotel').length,
                  bidsCount: bids.filter((b) => {
                    const r = requests.find((req) => req.id === b.request_id);
                    return r?.category === 'hotel';
                  }).length,
                  pct: '25%',
                },
                {
                  cat: 'BnBs & Cottages',
                  code: 'bnb',
                  count: requests.filter((r) => r.category === 'bnb').length,
                  bidsCount: bids.filter((b) => {
                    const r = requests.find((req) => req.id === b.request_id);
                    return r?.category === 'bnb';
                  }).length,
                  pct: '15%',
                },
              ].map((row) => (
                <div key={row.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900">{row.cat}</span>
                    <span className="text-stone-600 font-mono tabular-nums">
                      {row.count} requests &middot; {row.bidsCount} bids
                    </span>
                  </div>
                  <div className="w-full h-2 bg-desert-atlas-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mountain-hostel"
                      style={{ width: `${Math.max(15, (row.count / totalRequests) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-stone-500 border-t border-stone-100">
              Kenyan travel demand is led by Maasai Mara and Amboseli custom safaris, complemented by Diani Beach private villas.
            </div>
          </div>

          {/* Launch Milestones Checklist */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-100 pb-2">
              Launch Phase Checklist (@njuguna spec)
            </h2>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Phase 1: Build:</strong> All 14 pages across Public, Traveler, Operator, and Admin audiences live.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Phase 2: Seed &amp; Verify:</strong> 10–20 TRA verified operators onboarded with free trial initial access.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Phase 3: Safaricom Daraja STK Push:</strong> 24h Bidding Pass (KSH 850) &amp; Tiered Contact Unlocks (KSH 120 - 5,000). Automatic 24h timer enforcement.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Phase 4: Slot Governance:</strong> 30-bid automatic lock cap with traveler +10/+20 extension controls.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Ledger (M-Pesa Daraja records) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Safaricom Daraja M-Pesa Transaction Ledger
            </h2>
            <span className="text-xs font-mono font-bold text-stone-800">
              Total Settled: KSH {totalRevenueKSH.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">M-Pesa Receipt Code</th>
                  <th className="py-3 px-4 font-semibold">Operator Business</th>
                  <th className="py-3 px-4 font-semibold">Phone Number</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Paid Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Pass Coverage</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {payments.map((p) => {
                  const isActiveNow = p.pass_expires_at ? new Date(p.pass_expires_at).getTime() > Date.now() : false;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {p.mpesa_transaction_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {p.operator_business_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {p.phone_number}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {p.currency} {p.amount_ksh || p.amount}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-500">
                        {new Date(p.paid_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-mono">
                        {p.pass_expires_at
                          ? `Until ${new Date(p.pass_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(p.pass_expires_at).toLocaleDateString()})`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isActiveNow
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {isActiveNow ? 'Active Pass' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Moderation & Flagged Reports Queue */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-highlight-accent" />
              Safety &amp; Compliance Moderation Queue
            </h2>
            <span className="text-xs text-stone-500">
              Automated contact anti-circumvention and traveler reports
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="text-xs text-stone-500 text-center py-8">
              Zero active reports. Marketplace compliance is healthy.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">{rep.reason}</span>
                      <div className="text-stone-500">
                        Reported by: <strong>{rep.reported_by_name}</strong> &middot; Target: <span className="capitalize">{rep.target_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : rep.status === 'pending'
                            ? 'bg-desert-atlas-light text-safari-dusk border border-desert-atlas/50'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-stone-700 bg-white p-3 rounded-lg border border-stone-200">
                    <div className="text-stone-500 text-[11px] mb-0.5">Subject: {rep.target_title}</div>
                    <p>{rep.details}</p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => adminResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => adminResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
