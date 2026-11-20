import React, { useState } from 'react';
import { LegalModal } from './LegalModal';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('terms');
  const { setActiveTab } = useApp();

  const openLegal = (tab: 'privacy' | 'terms') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer className="relative overflow-hidden bg-safari-dusk-dark text-stone-300 text-sm border-t border-safari-dusk-light/30 mt-20">
        <img
          src="https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/vector-world-map-illustration.jpg"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            {/* Travel Categories */}
            <div className="space-y-3 flex flex-col items-center text-center">
              <div className="font-semibold text-xs text-desert-atlas uppercase tracking-wider">
                Travel Categories
              </div>
              <ul className="flex flex-col items-center gap-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveTab('operator-open-requests', 'safari')}
                    className="hover:text-desert-atlas-light transition-colors"
                  >
                    Safaris &amp; Guided Tours
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('operator-open-requests', 'hotel')}
                    className="hover:text-desert-atlas-light transition-colors"
                  >
                    Boutique Hotels &amp; Safari Lodges
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('operator-open-requests', 'bnb')}
                    className="hover:text-desert-atlas-light transition-colors"
                  >
                    Coastal Villas &amp; Country BnBs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="text-highlight-accent font-semibold hover:text-highlight-accent-muted transition-colors flex items-center justify-center gap-1"
                  >
                    Best Places in Kenya (Blog)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-safari-dusk-light/20 flex flex-col items-center text-center gap-4 text-xs text-stone-400">
            <div className="flex flex-col items-center gap-y-2">
              <button
                onClick={() => openLegal('privacy')}
                className="hover:text-desert-atlas transition-colors cursor-pointer"
              >
                Privacy Notice
              </button>
              <button
                onClick={() => openLegal('terms')}
                className="hover:text-desert-atlas transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
              <button
                onClick={() => setActiveTab('how-it-works')}
                className="hover:text-desert-atlas transition-colors cursor-pointer"
              >
                How It Works
              </button>
            </div>
            <div>
              &copy; 2026 Elephantastic Safaris.
            </div>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </>
  );
};
