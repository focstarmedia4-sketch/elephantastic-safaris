import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Clock, XCircle, CheckCircle2, ArrowRight, FileText, CreditCard } from 'lucide-react';

export const VerificationStatusPage: React.FC = () => {
  const { currentOperator, setActiveTab, currentUser } = useApp();

  if (!currentOperator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">No Operator Account Found</h2>
        <p className="text-xs text-stone-600">
          {currentUser
            ? `You are currently signed in as ${currentUser.name} (${currentUser.role}). Register your business to start operator verification.`
            : 'You are currently browsing as a guest. Please log in or register your business to start operator verification.'}
        </p>
        <button
          onClick={() => setActiveTab('operator-signup')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg"
        >
          Register as Operator
        </button>
      </div>
    );
  }

  const isApproved = currentOperator.status === 'approved';
  const isPending = currentOperator.status === 'pending';
  const isRejected = currentOperator.status === 'rejected';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
          Operator Account Status
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
          Operator Registration &amp; Access
        </h1>
        <p className="text-xs sm:text-sm text-mountain-hostel/80">
          Kenyan operators enjoy direct registration and instant access to open traveler requests without mandatory TRA licensing hurdles.
        </p>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-xl border border-desert-atlas/30 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-desert-atlas/15 pb-5">
          <div className="space-y-1">
            <div className="text-xs text-mountain-hostel/70">Business Name</div>
            <div className="text-lg font-bold text-safari-dusk font-display">
              {currentOperator.business_name}
            </div>
            <div className="text-xs text-mountain-hostel/80">
              Representative: {currentOperator.contact_name} &middot; {currentOperator.phone}
            </div>
          </div>

          <div>
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Operator
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Operator
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-bold">
                <XCircle className="w-4 h-4 text-red-600" />
                Account Inactive
              </span>
            )}
          </div>
        </div>

        {/* Status Narrative & Explanation */}
        {isApproved && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-desert-atlas-light/70 border border-desert-atlas/30 text-xs text-safari-dusk leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-safari-dusk font-display">
                <ShieldCheck className="w-4 h-4 text-highlight-accent" />
                Your operator account is active and verified!
              </div>
              <p className="text-mountain-hostel/80">
                Your business profile is active. You can now get a 24-hour Bidding Pass (KSH 850) or unlock traveler direct contacts individually (tiered KSH 120 to 5,000 based on budget) via M-Pesa.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('operator-dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
              >
                <CreditCard className="w-4 h-4" />
                Go to Operator Dashboard
              </button>
              <button
                onClick={() => setActiveTab('operator-open-requests')}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-mountain-hostel hover:bg-mountain-hostel-light border border-desert-atlas/30 rounded-xl transition-colors text-center cursor-pointer min-h-[44px]"
              >
                Browse Open Requests
              </button>
            </div>
          </div>
        )}

        {isPending && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-desert-atlas-light/70 border border-desert-atlas/30 text-xs text-safari-dusk leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-safari-dusk font-display">
                <Clock className="w-4 h-4 text-highlight-accent" />
                Document Verification in Progress
              </div>
              <p className="text-mountain-hostel/80">
                Our compliance admin team is verifying your submitted document ({currentOperator.licence_file_name}) against the Tourism Regulatory Authority records.
              </p>
              <p className="text-mountain-hostel/70">
                <strong>Rule:</strong> Payment of 24h access passes is unlocked only after approval, ensuring unverified operators never interact with travelers.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-red-950">
                <XCircle className="w-4 h-4 text-red-700" />
                Application Declined by Compliance Admin
              </div>
              <p>
                <strong>Reason given:</strong> {currentOperator.rejection_reason || 'Tourism Regulatory Authority licence number could not be validated or is expired.'}
              </p>
              <p className="text-stone-600">
                You may correct your documentation and resubmit for reconsideration.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('operator-signup')}
              className="px-4 py-2 text-xs font-semibold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Update Details &amp; Re-Upload Licence
            </button>
          </div>
        )}

        {/* Credentials Summary */}
        <div className="pt-4 border-t border-stone-100 text-xs space-y-3">
          <div className="font-semibold text-stone-800 uppercase tracking-wide">
            Submitted Operator Credentials
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-600">
            <div>
              <span className="text-stone-400 block">Operator Status:</span>
              <span className="font-semibold text-emerald-800">Verified &amp; Active</span>
            </div>
            <div>
              <span className="text-stone-400 block">Licencing Requirement:</span>
              <span className="font-medium text-stone-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Direct Access (No TRA Required)
              </span>
            </div>
            <div>
              <span className="text-stone-400 block">Covered Categories:</span>
              <span className="font-medium text-stone-900 capitalize">
                {currentOperator.categories.join(', ')}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block">Regions:</span>
              <span className="font-medium text-stone-900">
                {currentOperator.regions.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
