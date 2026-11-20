import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Shield, Check, X, Lock } from 'lucide-react';
import { Currency } from '../types';

interface TravelerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TravelerProfileModal: React.FC<TravelerProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateTravelerProfile } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [country, setCountry] = useState(currentUser?.country || 'United Kingdom');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currency, setCurrency] = useState<Currency>(currentUser?.preferred_currency || 'USD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setCountry(currentUser.country || 'United Kingdom');
      setPhone(currentUser.phone || '');
      setCurrency(currentUser.preferred_currency || 'USD');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTravelerProfile({
      name: name.trim() || 'Traveler',
      country,
      phone: phone.trim() || undefined,
      preferred_currency: currency,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk/70 backdrop-blur-xs">
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#E2DED3] max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1E5B43] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-tight text-white">
                Private Traveler Profile
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Confidential traveler preferences &amp; contact info
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Callout Banner */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#1E5B43] shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
            <strong>Complete Contact Privacy:</strong> Your phone number and email are <em>never</em> visible to bidding operators. They only see your general request, destination, and country. You choose specifically if and when to share your direct WhatsApp or phone.
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden font-medium"
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
              Email Address <span className="text-[#2F4858]/60 font-normal">(Private Account Email)</span>
            </label>
            <input
              type="email"
              disabled
              value={currentUser?.email || 'traveler@example.com'}
              className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#FAF8F5] text-[#2F4858]/70 outline-hidden font-medium cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                Area &amp; Country of Residence
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom, New York, London..."
                className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden font-medium min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden font-medium"
              >
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
              Optional Phone / WhatsApp <span className="text-[#2F4858]/60 font-normal">(Shared only when you confirm)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] focus:border-[#1E5B43] focus:ring-1 focus:ring-[#1E5B43] outline-hidden font-medium"
              placeholder="+44 7700 900123"
            />
          </div>

          <div className="pt-4 border-t border-[#E2DED3] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#2F4858] hover:text-[#1E5B43] rounded-xl hover:bg-stone-100 transition-colors min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs min-h-[44px]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
