import React from 'react';
import { useApp } from '../context/AppContext';
import { Compass, ShieldCheck, CreditCard, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
          Transparent Marketplace Rules
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-safari-dusk tracking-tight font-display">
          How Elephantastic Safaris works
        </h1>
        <p className="text-sm sm:text-base text-mountain-hostel/80 leading-relaxed">
          A fair reverse auction connecting global travelers with verified Kenyan hospitality providers without middlemen or hidden fees.
        </p>
      </div>

      {/* 3 Steps for Travelers */}
      <section className="space-y-6">
        <div className="border-b border-desert-atlas/30 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-safari-dusk font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-highlight-accent" />
            For Travelers: 3 Simple Steps
          </h2>
          <span className="text-xs font-semibold text-safari-dusk bg-desert-atlas-light px-2.5 py-1 rounded-md border border-desert-atlas/40">
            100% Free Always
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-desert-atlas/60 font-display">01</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Post What You Want</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Select Safari, Hotel, or BnB. Specify your preferred parks, dates, number of guests, vehicle preference (e.g. 4x4 pop-up Land Cruiser), and total budget. Your email and phone are completely hidden.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-desert-atlas/60 font-display">02</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Receive Blind Quotes</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Verified operators place private bids with itemized inclusions and pricing. Each request accepts up to 30 bids, then locks automatically so your inbox is never flooded.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-desert-atlas/60 font-display">03</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Compare &amp; Connect</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Review quotes side-by-side. Shortlist your favorites, read verified guest reviews, and share your WhatsApp or email only with the operator you choose to book with.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={() => setActiveTab('traveler-post')}
            className="px-6 py-3 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            Post Your Request Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3 Steps for Kenyan Operators */}
      <section className="space-y-6">
        <div className="border-b border-desert-atlas/30 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-safari-dusk font-display flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-desert-atlas-dark" />
            For Operators: 3 Steps to Direct Bookings
          </h2>
          <span className="text-xs font-semibold text-safari-dusk bg-desert-atlas-light px-2.5 py-1 rounded-md border border-desert-atlas/40">
            Reach Travelers: Bid (KSH 850 Pass) / Unlock Contact (KSH 120 - 5,000)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-desert-atlas/60 font-display">01</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Create Operator Profile</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Set up your business name, contact details, operating categories (Safaris, Hotels, or BnBs), and regions in minutes. Direct access with no mandatory TRA paperwork walls or verification delays.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-desert-atlas/60 font-display">02</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Bid or Unlock Direct Contacts</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Reach travelers in two ways: activate a <strong>KSH 850 24-hour Bidding Pass</strong> to bid directly on all requests across your categories, or pay a one-time <strong>Contact Unlock fee (tiered KSH 120 to 5,000 based on traveler budget)</strong> to immediately view the traveler&apos;s phone, WhatsApp, and email.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-desert-atlas/30 space-y-3 shadow-xs">
            <div className="text-2xl font-bold text-safari-dusk font-display">03</div>
            <h3 className="font-bold text-base text-safari-dusk font-display">Pitch &amp; Keep 100%</h3>
            <p className="text-xs text-mountain-hostel/80 leading-relaxed">
              Submit detailed proposals and itemized itineraries. When travelers choose you, communicate directly to finalize the booking. Elephantastic Safaris charges 0% commission on the trip value.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={() => setActiveTab('operator-signup')}
            className="px-6 py-3 text-xs font-semibold text-white bg-mountain-hostel hover:bg-mountain-hostel-light border border-desert-atlas/30 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            Register as a Verified Operator
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Rules Reference Table */}
      <section className="bg-white rounded-xl border border-desert-atlas/30 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-base text-safari-dusk font-display">
          Key Marketplace Rules &amp; Safeguards
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-desert-atlas-light border-b border-desert-atlas/30 text-safari-dusk">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Rule</th>
                <th className="py-2.5 px-3 font-semibold">Specification</th>
                <th className="py-2.5 px-3 font-semibold">Why It Exists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-desert-atlas/15 text-mountain-hostel">
              <tr>
                <td className="py-3 px-3 font-semibold text-safari-dusk">Bid Privacy</td>
                <td className="py-3 px-3">Operators never see competitor bids or quotes.</td>
                <td className="py-3 px-3 text-mountain-hostel/70">Prevents undercut price-wars that hurt vehicle maintenance or safety.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-safari-dusk">30 Slot Cap</td>
                <td className="py-3 px-3">Requests automatically lock at 30 submitted bids.</td>
                <td className="py-3 px-3 text-mountain-hostel/70">Ensures travelers are not overwhelmed by endless spam.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-safari-dusk">Traveler Extension</td>
                <td className="py-3 px-3">Only the traveler can add +10 or +20 slots, or +3/+7 days.</td>
                <td className="py-3 px-3 text-mountain-hostel/70">The traveler maintains complete authority over their listing.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-safari-dusk">Anti-Circumvention</td>
                <td className="py-3 px-3">Bids cannot contain phone numbers, emails, or links.</td>
                <td className="py-3 px-3 text-mountain-hostel/70">Protects traveler privacy and ensures fair review history.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-safari-dusk">Direct Access</td>
                <td className="py-3 px-3">Instant onboarding without mandatory TRA license walls.</td>
                <td className="py-3 px-3 text-mountain-hostel/70">Empowers all local Kenyan safari guides, boutique lodges, and hosts to connect directly.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
