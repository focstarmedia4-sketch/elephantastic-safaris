import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  Star,
  Share2,
  Phone,
  Mail,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const MyBidsPage: React.FC = () => {
  const { currentOperator, bids, requests, getContactShare, setActiveTab } = useApp();
  const [filter, setFilter] = useState<'all' | 'contact_shared' | 'shortlisted' | 'sent'>('all');

  if (!currentOperator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Operator Profile Needed</h2>
        <p className="text-xs text-stone-600">
          Switch to an operator persona to view your submitted quotes.
        </p>
        <button
          onClick={() => setActiveTab('operator-open-requests')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg"
        >
          Browse Open Requests
        </button>
      </div>
    );
  }

  // Get all bids sent by this operator
  const myBids = bids.filter((b) => b.operator_id === currentOperator.id);

  const displayedBids = myBids.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'contact_shared') return b.status === 'contact_shared';
    if (filter === 'shortlisted') return b.status === 'shortlisted';
    if (filter === 'sent') return b.status === 'sent' || b.status === 'viewed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
            Operator Quotations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
            My Submitted Bids ({myBids.length})
          </h1>
          <p className="text-xs sm:text-sm text-mountain-hostel/80">
            Track status across all quotes: sent, viewed, shortlisted, or contact shared.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('operator-open-requests')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          Browse Open Requests
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-desert-atlas-light/80 border border-desert-atlas/30 rounded-lg w-fit">
        {[
          { id: 'all', label: 'All Bids' },
          { id: 'contact_shared', label: 'Contact Shared (Hot Leads)' },
          { id: 'shortlisted', label: 'Shortlisted' },
          { id: 'sent', label: 'Sent / Under Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === tab.id
                ? 'bg-mountain-hostel text-white shadow-xs'
                : 'text-mountain-hostel hover:text-safari-dusk'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Bids */}
      {displayedBids.length === 0 ? (
        <div className="bg-white rounded-xl border border-desert-atlas/30 p-12 text-center space-y-3 shadow-xs">
          <Briefcase className="w-10 h-10 text-desert-atlas mx-auto" />
          <h3 className="text-base font-bold text-safari-dusk font-display">No Bids Found</h3>
          <p className="text-xs text-mountain-hostel/80 max-w-sm mx-auto">
            You have not submitted any bids in this status category yet.
          </p>
          <button
            onClick={() => setActiveTab('operator-open-requests')}
            className="px-4 py-2 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs"
          >
            View Open Requests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {displayedBids.map((bid) => {
            const req = requests.find((r) => r.id === bid.request_id);
            const contactShare = getContactShare(bid.request_id, currentOperator.id);
            const hasSharedContact = bid.status === 'contact_shared';

            return (
              <div
                key={bid.id}
                className={`bg-white rounded-xl border p-6 transition-all space-y-4 ${
                  hasSharedContact
                    ? 'border-emerald-600 shadow-md ring-1 ring-emerald-500/20'
                    : bid.status === 'shortlisted'
                    ? 'border-desert-atlas shadow-xs ring-1 ring-desert-atlas/40'
                    : 'border-desert-atlas/30'
                }`}
              >
                {/* Top Row: Request title and quote price */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-desert-atlas/15 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-mountain-hostel/70">
                      <span className="font-semibold text-desert-atlas-dark uppercase tracking-wide">
                        {req?.category || 'Request'}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span>Bid sent: {new Date(bid.created_at).toLocaleDateString()}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>Traveler: {req?.traveler_name} ({req?.traveler_country})</span>
                    </div>

                    <h2 className="text-base font-bold text-safari-dusk font-display">
                      {req?.title || 'Travel Request'}
                    </h2>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-lg font-bold text-safari-dusk font-mono tabular-nums">
                      {bid.currency} {bid.price.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-mountain-hostel/70">
                      Valid until {bid.valid_until}
                    </div>
                  </div>
                </div>

                {/* Status Callout Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {bid.status === 'contact_shared' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Traveler Shared Direct Contact Details!
                      </span>
                    )}

                    {bid.status === 'shortlisted' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-desert-atlas-light text-safari-dusk border border-desert-atlas/40 text-xs font-bold">
                        <Star className="w-4 h-4 text-desert-atlas-dark fill-desert-atlas-dark" />
                        Shortlisted by Traveler
                      </span>
                    )}

                    {bid.status === 'viewed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-desert-atlas-light/40 text-mountain-hostel border border-desert-atlas/30 text-xs font-medium">
                        <Eye className="w-4 h-4 text-mountain-hostel/60" />
                        Viewed by Traveler
                      </span>
                    )}

                    {bid.status === 'sent' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-300 text-xs font-medium">
                        <Clock className="w-4 h-4 text-stone-500" />
                        Quote Delivered
                      </span>
                    )}
                  </div>

                  {req && (
                    <button
                      onClick={() => setActiveTab('operator-request-detail', req.id)}
                      className="text-xs font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1"
                    >
                      View Request Spec &rarr;
                    </button>
                  )}
                </div>

                {/* UNLOCKED CONTACT DETAILS BOX (When contact is shared) */}
                {hasSharedContact && contactShare && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-700" />
                        Unlocked Traveler Contact Information
                      </span>
                      <span className="text-[11px] text-emerald-800 font-medium">
                        Preferred via: <strong className="capitalize">{contactShare.traveler_contact.preferred_channel}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-stone-500 block">Name:</span>
                        <span className="font-bold text-stone-900">{contactShare.traveler_contact.name}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${contactShare.traveler_contact.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {contactShare.traveler_contact.whatsapp}
                        </a>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Email:</span>
                        <a
                          href={`mailto:${contactShare.traveler_contact.email}`}
                          className="font-bold text-stone-900 hover:underline flex items-center gap-1 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-stone-500" />
                          {contactShare.traveler_contact.email}
                        </a>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-900">
                      Reach out directly to finalize itinerary and payment. Elephantastic Safaris takes 0% commission on the booking.
                    </div>
                  </div>
                )}

                {/* Pitch Message Snippet */}
                <div className="text-xs text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="font-semibold text-stone-900 block mb-0.5">Your pitch:</span>
                  <p className="line-clamp-2">{bid.message}</p>
                </div>

                {/* Inclusions summary */}
                <div className="text-xs text-stone-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-medium text-stone-800">Inclusions ({bid.inclusions.length}):</span>
                  {bid.inclusions.slice(0, 3).map((inc, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-emerald-600">✓</span>
                      <span>{inc}</span>
                    </span>
                  ))}
                  {bid.inclusions.length > 3 && (
                    <span className="text-stone-400">+{bid.inclusions.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
