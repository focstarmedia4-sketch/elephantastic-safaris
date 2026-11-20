import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const VerificationQueuePage: React.FC = () => {
  const { operators, adminApproveOperator, adminRejectOperator, switchUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModalOp, setRejectModalOp] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('TRA licence expired or unverified in registry');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOperators = operators.filter((op) => {
    if (filter !== 'all' && op.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        op.business_name.toLowerCase().includes(q) ||
        (op.licence_number && op.licence_number.toLowerCase().includes(q)) ||
        op.contact_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalOp) return;
    adminRejectOperator(rejectModalOp.id, rejectionReason);
    setRejectModalOp(null);
  };

  const pendingCount = operators.filter((o) => o.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
            Admin Compliance Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
            Operator Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-mountain-hostel/80">
            Review registered operator profiles, operating categories, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-desert-atlas-light text-safari-dusk border border-desert-atlas/40 font-bold">
            {pendingCount} Pending Applications
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-desert-atlas/20 pb-4">
        <div className="flex items-center gap-1 p-1 bg-desert-atlas-light/80 border border-desert-atlas/30 rounded-lg">
          {(['pending', 'all', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === tab
                  ? 'bg-mountain-hostel text-white shadow-xs'
                  : 'text-mountain-hostel hover:text-safari-dusk'
              }`}
            >
              {tab} ({operators.filter((o) => (tab === 'all' ? true : o.status === tab)).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-desert-atlas-dark absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business or contact name..."
            className="w-full text-xs rounded-lg border border-desert-atlas/40 pl-9 pr-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredOperators.length === 0 ? (
        <div className="bg-white rounded-xl border border-desert-atlas/30 p-12 text-center space-y-3 shadow-xs">
          <ShieldCheck className="w-10 h-10 text-desert-atlas mx-auto" />
          <h3 className="text-base font-bold text-safari-dusk font-display">No applications match this filter</h3>
          <p className="text-xs text-mountain-hostel/80">
            All submitted operator registrations have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredOperators.map((op) => (
            <div
              key={op.id}
              className="bg-white rounded-xl border border-desert-atlas/30 p-6 space-y-4 hover:border-desert-atlas transition-all shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-desert-atlas/15 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-safari-dusk font-display">
                      {op.business_name}
                    </h2>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border capitalize ${
                        op.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : op.status === 'pending'
                          ? 'bg-desert-atlas-light text-safari-dusk border-desert-atlas/40'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {op.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                    <span>Contact: <strong className="text-stone-800">{op.contact_name}</strong></span>
                    <span>&middot;</span>
                    <span>Phone: <strong className="text-stone-800 font-mono">{op.phone}</strong></span>
                    <span>&middot;</span>
                    <span>Email: <strong className="text-stone-800">{op.email}</strong></span>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {op.status !== 'approved' && (
                    <button
                      onClick={() => adminApproveOperator(op.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Licence
                    </button>
                  )}

                  {op.status !== 'rejected' && (
                    <button
                      onClick={() => setRejectModalOp(op)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject with Reason
                    </button>
                  )}
                </div>
              </div>

              {/* Account & Profile Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-100">
                <div>
                  <span className="text-stone-500 block mb-0.5">Licence / Registration:</span>
                  <span className="font-mono font-bold text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 inline-block">
                    {op.licence_number || 'Direct Onboarding (Exempt)'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 block mb-0.5">Verification Status:</span>
                  <span className="font-medium text-stone-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-desert-atlas-dark" />
                    {op.licence_file_name || 'Standard Account'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 block mb-0.5">Categories Authorized:</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {op.categories.join(', ')}
                  </span>
                </div>
              </div>

              {/* Operating Regions */}
              <div className="text-xs text-stone-600 flex flex-wrap items-center gap-1.5">
                <span className="text-stone-500">Regions Covered:</span>
                {op.regions.map((reg) => (
                  <span key={reg} className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                    {reg}
                  </span>
                ))}
              </div>

              {/* Rejection notice if present */}
              {op.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50/70 border border-red-200 text-xs text-red-900">
                  <strong>Rejection Reason on Record:</strong> {op.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <h3 className="text-base font-bold text-stone-900">
                Reject Operator Application
              </h3>
              <button
                onClick={() => setRejectModalOp(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
                  Business Entity
                </label>
                <div className="text-sm font-bold text-stone-900">
                  {rejectModalOp.business_name} ({rejectModalOp.licence_number})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Reason for Rejection (Displayed to operator)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the licence or document was declined..."
                  className="w-full text-xs rounded-lg border border-stone-300 p-3 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOp(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
