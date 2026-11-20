import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelCategory } from '../../types';
import { LegalModal } from '../../components/LegalModal';
import { Briefcase, Upload, ShieldCheck, Check, ArrowRight, FileText, AlertCircle } from 'lucide-react';

export const OperatorSignupPage: React.FC = () => {
  const { currentUser, currentOperator, registerOperator, setActiveTab } = useApp();

  const [businessName, setBusinessName] = useState(currentOperator?.business_name || '');
  const [contactName, setContactName] = useState(currentOperator?.contact_name || currentUser?.name || '');
  const [phone, setPhone] = useState(currentOperator?.phone || '+254 7');
  const [email, setEmail] = useState(currentOperator?.email || currentUser?.email || '');
  const [categories, setCategories] = useState<TravelCategory[]>(
    currentOperator?.categories || ['safari', 'hotel']
  );
  const [regions, setRegions] = useState<string[]>(
    currentOperator?.regions || ['Maasai Mara', 'Amboseli', 'Nairobi']
  );
  const [submitted, setSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: TravelCategory) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const toggleRegion = (region: string) => {
    if (regions.includes(region)) {
      if (regions.length > 1) {
        setRegions(regions.filter((r) => r !== region));
      }
    } else {
      setRegions([...regions, region]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError('Please accept the Terms of Use to complete your business registration.');
      return;
    }
    registerOperator({
      business_name: businessName,
      contact_name: contactName,
      phone,
      email,
      categories,
      regions,
    });
    setSubmitted(true);
    setTimeout(() => {
      setActiveTab('operator-open-requests');
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
          Kenyan Hospitality Operators Only
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
          Register Your Travel Business
        </h1>
        <p className="text-xs sm:text-sm text-mountain-hostel/80">
          Join Kenyan tour companies, boutique safari lodges, and coastal hosts. Fast direct registration with no paperwork hurdles — start quoting on international traveler inquiries right away.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-desert-atlas/30 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Step 1: Business Identification */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-safari-dusk border-b border-desert-atlas/15 pb-2 uppercase tracking-wide font-display">
            1. Registered Entity Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Mara Wild Expeditions Ltd"
                className="w-full text-sm rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Authorized Representative
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Jackson Ole Kaelo"
                className="w-full text-sm rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Official Business Phone (M-Pesa enabled)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 722 000 000"
                className="w-full text-sm rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk font-mono focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bookings@marawild.co.ke"
                className="w-full text-sm rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Categories & Regions */}
        <div className="space-y-4 pt-4 border-t border-desert-atlas/15">
          <h2 className="text-sm font-bold text-safari-dusk border-b border-desert-atlas/15 pb-2 uppercase tracking-wide font-display">
            2. Categories Served &amp; Regions
          </h2>

          <div>
            <label className="block text-xs font-semibold text-safari-dusk mb-2">
              Select Operating Categories (Your 24h pass covers all selected categories)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'safari', label: 'Safaris & Tours', desc: 'Game drives, custom 4x4 safaris' },
                { id: 'hotel', label: 'Hotels & Lodges', desc: 'City hotels, tented bush camps' },
                { id: 'bnb', label: 'BnBs & Cottages', desc: 'Coastal beach villas, serviced stays' },
              ].map((c) => {
                const active = categories.includes(c.id as TravelCategory);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.id as TravelCategory)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      active
                        ? 'border-highlight-accent bg-desert-atlas-light text-safari-dusk font-semibold shadow-2xs ring-1 ring-highlight-accent/30'
                        : 'border-desert-atlas/30 bg-white text-mountain-hostel hover:border-desert-atlas'
                    }`}
                  >
                    <div className="text-xs font-bold">{active ? '✓ ' : '+ '}{c.label}</div>
                    <div className="text-[11px] text-mountain-hostel/70 font-normal mt-0.5">{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-safari-dusk mb-2">
              Operating Regions / Destinations Covered
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Maasai Mara',
                'Amboseli',
                'Tsavo East & West',
                'Lake Nakuru & Naivasha',
                'Samburu & Shaba',
                'Nairobi Metropolis',
                'Diani Beach & South Coast',
                'Mombasa & North Coast',
                'Watamu & Malindi',
                'Laikipia & Ol Pejeta',
              ].map((reg) => {
                const active = regions.includes(reg);
                return (
                  <button
                    type="button"
                    key={reg}
                    onClick={() => toggleRegion(reg)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-desert-atlas-light border-highlight-accent text-safari-dusk font-semibold'
                        : 'bg-stone-50 border-desert-atlas/30 text-mountain-hostel hover:border-desert-atlas'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{reg}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Terms of Use Acceptance */}
        <div className="pt-2 space-y-3 border-t border-desert-atlas/15">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div
            className={`rounded-xl border p-3.5 transition-colors ${
              acceptedTerms
                ? 'border-[#1E5B43]/40 bg-emerald-50/50'
                : 'border-desert-atlas/40 bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={acceptedTerms}
                aria-label="Accept Terms of Use"
                onClick={() => {
                  setAcceptedTerms((prev) => !prev);
                  if (error) setError(null);
                }}
                className="min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    acceptedTerms
                      ? 'bg-[#1E5B43] border-[#1E5B43] text-white'
                      : 'bg-white border-stone-400 text-transparent hover:border-safari-dusk'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </button>
              <div className="text-xs text-mountain-hostel leading-relaxed pt-0.5">
                <span>I accept the </span>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="font-bold text-[#1E5B43] underline underline-offset-2 hover:text-[#154331] cursor-pointer"
                >
                  Terms of Use
                </button>
                <span> of Elephantastic Safaris.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-3 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            Complete Registration &amp; Access Requests
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab="terms"
        onAccept={() => {
          setAcceptedTerms(true);
          if (error) setError(null);
        }}
      />
    </div>
  );
};
