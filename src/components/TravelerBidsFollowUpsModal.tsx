import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBidMessages } from '../utils/bidFollowUps';
import {
  X,
  MessageSquare,
  ShieldCheck,
  Star,
  ArrowRight,
  Calendar,
  MessageCircle,
  Mail,
  PhoneCall,
  Clock,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface TravelerBidsFollowUpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TravelerBidsFollowUpsModal: React.FC<TravelerBidsFollowUpsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, requests, bids, operators, setActiveTab, openAuthPrompt } = useApp();
  const [filterMode, setFilterMode] = useState<'all' | 'followups'>('all');

  const myRequests = useMemo(() => {
    return currentUser
      ? requests.filter((r) => r.traveler_id === currentUser.id)
      : requests.filter(
          (r) => r.traveler_id === 'user_traveler_1' || r.traveler_id.startsWith('traveler_guest')
        );
  }, [currentUser, requests]);

  const enrichedBids = useMemo(() => {
    const reqMap = new Map(myRequests.map((r) => [r.id, r]));
    return bids
      .filter((b) => reqMap.has(b.request_id))
      .map((bid) => {
        const req = reqMap.get(bid.request_id)!;
        const parsed = parseBidMessages(bid);
        const latestFollowUpTime =
          parsed.followUps.length > 0
            ? new Date(parsed.followUps[parsed.followUps.length - 1].created_at).getTime() || 0
            : 0;
        const sortTime = Math.max(new Date(bid.created_at).getTime() || 0, latestFollowUpTime);
        return {
          bid,
          req,
          initialMessage: parsed.initialMessage,
          followUps: parsed.followUps,
          sortTime,
        };
      })
      .sort((a, b) => b.sortTime - a.sortTime);
  }, [bids, myRequests]);

  const totalFollowUps = useMemo(
    () => enrichedBids.reduce((sum, item) => sum + item.followUps.length, 0),
    [enrichedBids]
  );

  const visibleItems = useMemo(() => {
    if (filterMode === 'followups') {
      return enrichedBids.filter((item) => item.followUps.length > 0);
    }
    return enrichedBids;
  }, [enrichedBids, filterMode]);

  if (!isOpen) return null;

  const formatTimestamp = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }
    return `${parsedDate.toLocaleDateString()} at ${parsedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Operator Bids and Follow-Up Messages"
    >
      <div className="bg-white rounded-2xl border border-[#E2DED3] max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans text-stone-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2DED3] bg-[#FAF9F6] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1E5B43] border border-emerald-200">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-['Space_Grotesk']">
                  Operator Bids &amp; Follow-Up Messages
                </h2>
                <p className="text-xs text-stone-600">
                  Review custom quotes and follow-up updates sent by verified Kenyan operators for your requests.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary & Filter Controls */}
        <div className="px-6 py-3.5 border-b border-[#E2DED3] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors min-h-[38px] cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#1E5B43] text-white border-[#1E5B43]'
                  : 'bg-[#FAF9F6] text-stone-700 border-[#E2DED3] hover:border-[#1E5B43]'
              }`}
            >
              All Bids ({enrichedBids.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('followups')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors min-h-[38px] cursor-pointer ${
                filterMode === 'followups'
                  ? 'bg-[#1E5B43] text-white border-[#1E5B43]'
                  : 'bg-[#FAF9F6] text-stone-700 border-[#E2DED3] hover:border-[#1E5B43]'
              }`}
            >
              With Follow-Ups ({totalFollowUps})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (!currentUser) {
                openAuthPrompt('traveler', 'traveler-my-requests', undefined, 'My Requests');
              } else {
                setActiveTab('traveler-my-requests');
              }
            }}
            className="text-xs font-bold text-[#1E5B43] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Go to My Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F6F4EE]">
          {visibleItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2DED3] p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E5B43] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-['Space_Grotesk']">
                {filterMode === 'followups'
                  ? 'No operator follow-up messages yet'
                  : 'No operator bids or follow-ups yet'}
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                {myRequests.length === 0
                  ? 'Post a free travel request to start receiving custom itineraries, quotes, and follow-up messages from verified operators.'
                  : 'Verified operators reviewing your request will submit their custom proposals and any follow-up clarifications right here.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (!currentUser) {
                      openAuthPrompt('traveler', 'traveler-post', undefined, 'Post a Request');
                    } else {
                      setActiveTab('traveler-post');
                    }
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post a Request
                </button>
              </div>
            </div>
          ) : (
            visibleItems.map(({ bid, req, initialMessage, followUps }) => {
              const amount = bid.amount || bid.price;
              const isShortlisted = bid.status === 'shortlisted';
              const isDeclined = bid.status === 'declined';

              return (
                <div
                  key={bid.id}
                  className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs ${
                    isShortlisted
                      ? 'border-[#1E5B43] ring-1 ring-[#1E5B43]/20'
                      : 'border-[#E2DED3]'
                  }`}
                >
                  {/* Request context header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2DED3]">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-['Space_Grotesk']">
                        For Request
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setActiveTab('traveler-request-detail', req.id);
                        }}
                        className="text-sm font-bold text-stone-900 hover:text-[#1E5B43] text-left transition-colors font-['Space_Grotesk'] cursor-pointer"
                      >
                        {req.title}
                      </button>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {req.start_date} to {req.end_date}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setActiveTab('traveler-request-detail', req.id);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl transition-colors inline-flex items-center gap-1.5 min-h-[40px] cursor-pointer shrink-0"
                    >
                      <span>View Request &amp; Bids</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Operator quote summary */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-stone-900 font-['Space_Grotesk']">
                          {bid.operator_business_name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E5B43]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-700">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {bid.operator_rating} ({bid.operator_review_count})
                        </span>
                        {isShortlisted && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#1E5B43] border border-emerald-200">
                            Shortlisted
                          </span>
                        )}
                        {isDeclined && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            Declined
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Bid sent {new Date(bid.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>Valid until {bid.valid_until}</span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-lg font-bold text-[#1E5B43] font-['Space_Grotesk'] tabular-nums">
                        {bid.currency} {amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {bid.inclusions.length} inclusions listed
                      </div>
                    </div>
                  </div>

                  {/* Initial Operator Pitch */}
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DED3] space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-['Space_Grotesk']">
                      Operator Bid Proposal
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                      {initialMessage}
                    </p>
                  </div>

                  {/* Follow-Up Messages */}
                  {followUps.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E5B43] font-['Space_Grotesk'] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Operator Follow-Up Messages ({followUps.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {followUps.map((fu) => (
                          <div
                            key={fu.id}
                            className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-1"
                          >
                            <div className="text-[10px] font-semibold text-stone-500">
                              {formatTimestamp(fu.created_at)}
                            </div>
                            <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                              {fu.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Operator Contact Details */}
                  {(() => {
                    const matchedOp = operators.find((o) => o.id === bid.operator_id);
                    const whatsappNum = bid.operator_whatsapp || matchedOp?.phone || '';
                    const phoneNum = bid.operator_phone || matchedOp?.phone || '';
                    const emailAddr = bid.operator_email || matchedOp?.email || '';

                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1E5B43] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                            <PhoneCall className="w-3.5 h-3.5" />
                            Operator Contact Details
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium">Direct Reach</span>
                        </div>

                        {whatsappNum || phoneNum || emailAddr ? (
                          <div className="grid grid-cols-1 gap-1.5 text-xs">
                            {whatsappNum && (
                              <a
                                href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-[#1E5B43] hover:bg-emerald-50 transition-colors font-medium min-h-[40px]"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="break-all">
                                    WhatsApp: <strong className="text-stone-900">{whatsappNum}</strong>
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold underline shrink-0">Chat &rarr;</span>
                              </a>
                            )}

                            {phoneNum && (
                              <a
                                href={`tel:${phoneNum}`}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-stone-800 hover:bg-stone-50 transition-colors font-medium min-h-[40px]"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <PhoneCall className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                                  <span className="break-all">
                                    Phone Call: <strong className="text-stone-900">{phoneNum}</strong>
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold underline text-[#1E5B43] shrink-0">Call &rarr;</span>
                              </a>
                            )}

                            {emailAddr && (
                              <a
                                href={`mailto:${emailAddr}`}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-stone-800 hover:bg-stone-50 transition-colors font-medium min-h-[40px]"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <Mail className="w-3.5 h-3.5 text-[#1E5B43] shrink-0" />
                                  <span className="break-all">
                                    Email: <strong className="text-stone-900">{emailAddr}</strong>
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold underline text-[#1E5B43] shrink-0">Email &rarr;</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-stone-600 bg-white px-3 py-2 rounded-lg border border-emerald-200">
                            Contact details were not included on this quote.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
