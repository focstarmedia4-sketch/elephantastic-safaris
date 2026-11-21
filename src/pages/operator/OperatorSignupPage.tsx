import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelCategory } from '../../types';
import { LegalModal } from '../../components/LegalModal';
import { startGoogleOAuth } from '../../utils/googleAuth';
import { Briefcase, Upload, ShieldCheck, Check, ArrowRight, FileText, AlertCircle, Loader2 } from 'lucide-react';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleFallbackUrl, setGoogleFallbackUrl] = useState<string | null>(null);
  const googleInFlightRef = React.useRef(false);

  React.useEffect(() => {
    const resetGoogleState = () => {
      googleInFlightRef.current = false;
      setIsGoogleLoading(false);
    };
    window.addEventListener('pageshow', resetGoogleState);
    return () => window.removeEventListener('pageshow', resetGoogleState);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError('Please accept the Terms of Use to complete your business registration.');
      return;
    }
    const res = await registerOperator({
      business_name: businessName,
      contact_name: contactName,
      phone,
      email,
      categories,
      regions,
    });
    if (!res.success) {
      setError(res.error || 'Failed to save operator profile in Supabase.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setActiveTab('operator-open-requests');
    }, 300);
  };

  const handleGoogleOperatorSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (googleInFlightRef.current) return;

    googleInFlightRef.current = true;
    setError(null);
    setGoogleFallbackUrl(null);
    setIsGoogleLoading(true);

    const res = await startGoogleOAuth('operator');
    if (res.error) {
      googleInFlightRef.current = false;
      setIsGoogleLoading(false);
      setError(res.error);
      return;
    }

    if (res.openedInNewTab && res.url) {
      googleInFlightRef.current = false;
      setIsGoogleLoading(false);
      setGoogleFallbackUrl(res.url);
    }
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
        {/* Google OAuth Quick Signup (Operator Only) */}
        {!currentUser && (
          <div className="space-y-3">
            <div className="rounded-xl border border-safari-dusk/30 bg-desert-atlas-light/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-safari-dusk flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-mountain-hostel" />
                  Google Sign-Up Account Type:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-safari-dusk text-white text-[10px] font-bold uppercase tracking-wide">
                  Operator
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                Signing in here registers your Google account as a <strong>Kenyan Operator</strong> so you can manage your business profile, bid on requests, and unlock leads.
              </p>
              <button
                type="button"
                onClick={handleGoogleOperatorSignup}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-stone-800 bg-white hover:bg-stone-50 disabled:opacity-70 disabled:cursor-wait border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-xs cursor-pointer min-h-[44px]"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-safari-dusk" />
                    Connecting to Google as Operator...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    Continue with Google as Operator
                  </>
                )}
              </button>

              {googleFallbackUrl && (
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] text-stone-700 space-y-1">
                  <p>
                    Google sign-in for <strong>Operator</strong> opened in a new tab.
                  </p>
                  <a
                    href={googleFallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#1E5B43] underline hover:text-[#154331]"
                  >
                    Didn&apos;t open? Click here to continue to Google &rarr;
                  </a>
                </div>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-desert-atlas/20" />
              <span className="mx-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                or register with business email
              </span>
              <div className="flex-grow border-t border-desert-atlas/20" />
            </div>
          </div>
        )}

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
