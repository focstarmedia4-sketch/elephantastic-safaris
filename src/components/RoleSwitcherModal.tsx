import React from 'react';
import { X, UserCheck, ShieldCheck, Compass, Briefcase, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, operators, switchUser, resetAllData, logoutUser } = useApp();

  if (!isOpen) return null;

  const personas = [
    {
      userId: 'user_traveler_1',
      title: 'Sarah Jenkins',
      role: 'Traveler (UK)',
      desc: 'Has 3 requests: Open Safari (12 bids), Locked Hotel (30/30 slots filled), and Closed BnB.',
      badge: 'Free Posting',
      icon: Compass,
    },
    {
      userId: 'user_traveler_2',
      title: 'David Miller',
      role: 'Traveler (US)',
      desc: 'Looking for a private beachfront Diani villa and Tsavo wilderness trip.',
      badge: 'Free Posting',
      icon: Compass,
    },
    {
      userId: 'user_operator_1',
      title: 'Jackson Ole Kaelo (Mara Wild)',
      role: 'Operator (Approved · Active Pass)',
      desc: 'Licensed safari operator with an active 24-hour pass (9h left). Complete profile, bookmarked requests, and payments history.',
      badge: 'Active Passes',
      icon: Briefcase,
    },
    {
      userId: 'user_operator_2',
      title: 'Amina Swaleh (Swahili Coast)',
      role: 'Operator (Approved · Expired Pass)',
      desc: 'Pass expired 3 hours ago. Demonstrates expired pass card and KSH 850 M-Pesa STK push checkout.',
      badge: 'Pass Expired',
      icon: Briefcase,
    },
    {
      userId: 'user_operator_3',
      title: 'Brian Mwangi (Rift Valley Stays)',
      role: 'Operator (Incomplete Profile)',
      desc: 'Incomplete profile. Demonstrates the Profile Gate banner with disabled Pay & Bid buttons.',
      badge: 'Profile Incomplete',
      icon: Briefcase,
    },
    {
      userId: 'user_admin_1',
      title: 'Njeri Njuguna',
      role: 'Platform Admin',
      desc: 'Reviews operator profiles, monitors M-Pesa payments & slot capacity.',
      badge: 'Trust & Admin',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk-dark/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-desert-atlas/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-desert-atlas/30 bg-desert-atlas-light">
          <div>
            <h2 className="text-base font-bold text-safari-dusk font-display">Switch Demo Persona</h2>
            <p className="text-xs text-mountain-hostel/80">
              Test all 14 pages and marketplace rules across Traveler, Operator, and Admin roles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-mountain-hostel/60 hover:text-safari-dusk rounded-lg hover:bg-desert-atlas/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona list */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {personas.map((p) => {
            const isCurrent = currentUser?.id === p.userId;
            const Icon = p.icon;
            return (
              <button
                key={p.userId}
                onClick={() => {
                  switchUser(p.userId);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'border-highlight-accent bg-desert-atlas-light/70 shadow-xs ring-1 ring-highlight-accent/30'
                    : 'border-desert-atlas/30 hover:border-desert-atlas hover:bg-desert-atlas-light/30'
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 mt-0.5 ${
                    isCurrent ? 'bg-highlight-accent text-white' : 'bg-desert-atlas-light text-mountain-hostel'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-safari-dusk truncate font-display">
                      {p.title}
                    </span>
                    <span className="text-[11px] font-semibold text-desert-atlas-dark whitespace-nowrap">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-xs text-mountain-hostel/80 mt-0.5 line-clamp-2">{p.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-desert-atlas/30 bg-desert-atlas-light/50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Reset all demo requests, bids, and payments to default initial state?')) {
                resetAllData();
                onClose();
              }
            }}
            className="text-xs text-mountain-hostel hover:text-safari-dusk flex items-center gap-1.5 font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset demo data
          </button>

          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                onClick={() => {
                  logoutUser();
                  onClose();
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Log Out (Guest Mode)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-mountain-hostel hover:text-safari-dusk bg-white border border-desert-atlas/40 rounded-lg hover:bg-desert-atlas-light transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
