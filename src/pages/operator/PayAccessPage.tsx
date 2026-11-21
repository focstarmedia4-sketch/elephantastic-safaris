import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PassType } from '../../types';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Unlock,
  PhoneCall,
  Send,
  MessageCircle,
} from 'lucide-react';

export const PayAccessPage: React.FC = () => {
  const {
    currentOperator,
    payments,
    submitMpesaPayment,
    isBiddingPassActive,
    isContactPassActive,
    getBiddingPassTimeRemaining,
    getContactPassTimeRemaining,
    setActiveTab,
  } = useApp();

  const [phone, setPhone] = useState(currentOperator?.phone || '');
  const [selectedPass, setSelectedPass] = useState<PassType>('bidding');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkPromptVisible, setStkPromptVisible] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<{
    transactionId: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentOperator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Operator Profile Required</h2>
        <p className="text-xs text-stone-600">
          Sign in with an operator account and complete your operator profile to view payment and pass history.
        </p>
      </div>
    );
  }

  const hasBiddingPass = isBiddingPassActive(currentOperator);
  const biddingPassInfo = getBiddingPassTimeRemaining(currentOperator);

  const hasContactPass = isContactPassActive(currentOperator);
  const contactPassInfo = getContactPassTimeRemaining(currentOperator);

  const currentAmount = 850;

  // Filter payment records for this operator
  const myPayments = payments.filter((p) => p.operator_id === currentOperator.id);

  const handleStartStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLastPaymentResult(null);
    setIsProcessing(true);
    setStkPromptVisible(true);

    const res = await submitMpesaPayment(currentOperator.id, phone, 'bidding');
    setIsProcessing(false);
    setStkPromptVisible(false);

    if (res.success) {
      setLastPaymentResult({
        transactionId: res.transactionId,
        message: res.message,
      });
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <span className="text-xs font-semibold text-[#1E5B43] uppercase tracking-wider block">
          Operator Access &amp; M-Pesa Billing
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E5B43] tracking-tight font-heading">
          24-Hour Bidding Pass
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Reach travelers by placing private bids directly on the platform for 24 hours. Contact unlocking is separate and can be done per listing without a pass.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Pass Status & M-Pesa Payment Box */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Passes Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Bidding Pass Status Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              hasBiddingPass ? 'bg-[#EBF3EF] border-[#1E5B43]' : 'bg-white border-[#E2DED3]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1E5B43] uppercase tracking-wide flex items-center gap-1.5 font-heading">
                  <Send className="w-3.5 h-3.5 text-[#1E5B43]" />
                  Bidding Pass (24 Hours)
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                  KSH 850
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs">
                  {hasBiddingPass ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[#1E5B43]">
                      <Unlock className="w-3 h-3 text-[#1E5B43]" />
                      Active ({biddingPassInfo.label})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-stone-500">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Inactive / Expired
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Place unlimited private bids across all open requests in your selected categories.
                </p>
              </div>
            </div>

            {/* 2. Contact Unlock Summary Card */}
            <div className="p-5 rounded-2xl border bg-white border-[#E2DED3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5 font-heading">
                  <PhoneCall className="w-3.5 h-3.5 text-[#1E5B43]" />
                  Contact Unlocks (Per Listing)
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                  From KSH 120
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-stone-600">
                  Unlocking contacts is done per listing based on the traveler&apos;s budget (KSH 120 - 5,000). Does not require a bidding pass.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('operator-dashboard')}
                    className="text-xs font-semibold text-[#1E5B43] hover:underline flex items-center gap-1"
                  >
                    <span>Go to Operator Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pass Selection Info */}
          <div className="bg-white rounded-2xl border border-[#E2DED3] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-[#1E5B43] uppercase tracking-wide border-b border-[#E2DED3] pb-2 font-heading">
              24-Hour Unlimited Bidding Pass
            </h2>

            <div className="p-4 rounded-xl border border-[#1E5B43] bg-[#EBF3EF]/40 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[#1E5B43] font-heading flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#1E5B43]" />
                    All Requests in Your Categories
                  </div>
                  <div className="text-xs text-stone-600 leading-relaxed">
                    Bid on every open travel request for 24 hours. Bids remain private inside the platform and stay open until the traveler closes the enquiry.
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2DED3] flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Bidding Pass Fee:</span>
                <span className="text-lg font-bold text-[#1E5B43] font-mono">
                  KSH 850
                </span>
              </div>
            </div>
          </div>

          {/* M-Pesa STK Push Form */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                  M
                </div>
                <h2 className="text-base font-bold text-stone-900 font-display">
                  Safaricom M-Pesa STK Push Checkout
                </h2>
              </div>

              <span className="text-sm font-bold text-stone-900 bg-stone-100 px-3 py-1 rounded-md font-mono">
                KSH {currentAmount}.00
              </span>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {lastPaymentResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  M-Pesa Payment Confirmed!
                </div>
                <p>{lastPaymentResult.message}</p>
                <div className="font-mono text-emerald-800 text-[11px] pt-1">
                  M-Pesa Transaction Ref: <strong>{lastPaymentResult.transactionId}</strong>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('operator-open-requests')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg min-h-[36px]"
                  >
                    Go to Open Requests &rarr;
                  </button>
                </div>
              </div>
            )}

            {stkPromptVisible ? (
              <div className="p-8 rounded-xl bg-emerald-50/60 border border-emerald-300 text-center space-y-4 animate-pulse">
                <Smartphone className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">
                    STK Push Sent to Your Phone
                  </h3>
                  <p className="text-xs text-stone-600">
                    Check your phone ({phone}). Enter your 4-digit M-Pesa PIN on the prompt to complete KSH {currentAmount} payment.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-800 font-semibold">
                  Calling M-Pesa Edge Function...
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartStkPush} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    M-Pesa Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 254712345678 or 0712345678"
                      className="w-full text-base font-mono rounded-lg border border-desert-atlas/40 px-3.5 py-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                    />
                  </div>
                  <p className="text-[11px] text-mountain-hostel/70 mt-1">
                    Supports Safaricom numbers (formats: 2547..., 2541..., 07..., 01...).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-desert-atlas-light/60 border border-desert-atlas/30 text-xs text-mountain-hostel space-y-1">
                  <div className="font-semibold text-safari-dusk">Payment Breakdown:</div>
                  <div className="flex justify-between">
                    <span>
                      {selectedPass === 'contact_unlock'
                        ? '24-Hour Direct Contact Unlock Pass'
                        : '24-Hour Bidding Pass (All available requests)'}
                    </span>
                    <span className="font-mono font-bold text-safari-dusk">KSH {currentAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking Commission</span>
                    <span className="font-mono font-bold text-highlight-accent">0% (KSH 0)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  Send M-Pesa STK Push Prompt (KSH {currentAmount})
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Pass Rules & Payment History */}
        <div className="space-y-6">
          {/* Payment Receipts & Ledger */}
          <div className="bg-white rounded-xl border border-desert-atlas/30 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-stone-600" />
                M-Pesa Receipts History
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                {myPayments.length} records
              </span>
            </div>

            {myPayments.length === 0 ? (
              <div className="text-xs text-stone-500 text-center py-4">
                No past transactions found.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {myPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-900">
                        {p.mpesa_transaction_id}
                      </span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {p.currency} {p.amount}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-safari-dusk">
                      {p.type === 'unlock' ? (p.request_title ? `Unlock: ${p.request_title}` : 'Contact Unlock') : '24h Bidding Pass'}
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Paid: {new Date(p.paid_at).toLocaleString()}
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Pass until: {p.pass_expires_at ? new Date(p.pass_expires_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
