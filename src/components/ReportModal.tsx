import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'operator' | 'bid' | 'request';
  targetId: string;
  targetTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { reportTarget } = useApp();
  const [reason, setReason] = useState('Unsolicited Contact Circumvention');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportTarget({
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      reason,
      details,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk-dark/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-desert-atlas/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-desert-atlas/30 bg-desert-atlas-light">
          <div className="flex items-center gap-2 text-safari-dusk">
            <AlertTriangle className="w-5 h-5 text-highlight-accent" />
            <h2 className="text-base font-bold font-display">Report {targetType}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-mountain-hostel/60 hover:text-safari-dusk rounded-lg hover:bg-desert-atlas/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-safari-dusk font-display">Report Submitted</h3>
            <p className="text-sm text-mountain-hostel/80">
              Our trust and safety team will review this report against platform standards.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-mountain-hostel/70 uppercase tracking-wide mb-1">
                Subject
              </label>
              <div className="text-sm font-semibold text-safari-dusk truncate font-display">
                {targetTitle}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              >
                <option value="Unsolicited Contact Circumvention">Unsolicited contact sharing in bids</option>
                <option value="Misleading Pricing or Inclusions">Misleading pricing or false inclusions</option>
                <option value="Suspicious Licencing">Suspicious or unverified credentials</option>
                <option value="Harassment or Spam">Inappropriate language or spam</option>
                <option value="Other Policy Violation">Other terms of service violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred..."
                className="w-full text-sm rounded-lg border border-desert-atlas/40 p-3 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-mountain-hostel hover:text-safari-dusk hover:bg-desert-atlas-light rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
