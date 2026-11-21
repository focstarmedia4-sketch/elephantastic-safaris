import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TravelRequest } from '../types';
import {
  Share2,
  X,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Send,
  Link2,
  ExternalLink,
} from 'lucide-react';

interface ShareRequestButtonProps {
  request: TravelRequest;
  variant?: 'icon' | 'button' | 'compact';
  className?: string;
}

export const getShareableRequestUrl = (requestId: string): string => {
  if (typeof window === 'undefined') {
    return `/request/${encodeURIComponent(requestId)}`;
  }
  return `${window.location.origin}/request/${encodeURIComponent(requestId)}`;
};

export const ShareRequestButton: React.FC<ShareRequestButtonProps> = ({
  request,
  variant = 'button',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = getShareableRequestUrl(request.id);
  const categoryLabel =
    request.category === 'safari'
      ? 'Kenya Safari'
      : request.category === 'hotel'
      ? 'Kenya Hotel & Lodge'
      : 'Kenya BnB & Villa';
  const shareTitle = `${request.title} | Elephantastic Safaris`;
  const shareText = `Check out this ${categoryLabel} travel request on Elephantastic Safaris: "${request.title}" (${request.start_date} to ${request.end_date}, Budget: ${request.currency} ${request.budget.toLocaleString()}).`;

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCopied(false);
    setIsOpen(true);
  };

  const handleCopyLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const tempInput = document.createElement('input');
      tempInput.value = shareUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User dismissed native share sheet
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedWhatsApp = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
  const encodedEmailBody = encodeURIComponent(`${shareText}\n\nView full request here:\n${shareUrl}`);

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedWhatsApp}`,
      bgClass: 'bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 text-[#128C7E]',
      icon: <MessageCircle className="w-4 h-4 shrink-0" />,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      bgClass: 'bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/30 text-[#1877F2]',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      bgClass: 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-900',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      bgClass: 'bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border-[#0A66C2]/30 text-[#0A66C2]',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      bgClass: 'bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border-[#229ED9]/30 text-[#229ED9]',
      icon: <Send className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedEmailBody}`,
      bgClass: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900',
      icon: <Mail className="w-4 h-4 shrink-0" />,
    },
  ];

  const modal =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk/65 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-modal-title-${request.id}`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-desert-atlas/30 shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-safari-dusk text-white px-5 py-4 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-desert-atlas flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    Share Travel Request
                  </div>
                  <h3
                    id={`share-modal-title-${request.id}`}
                    className="text-sm font-bold text-white leading-snug line-clamp-2 font-display"
                  >
                    {request.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  aria-label="Close share dialog"
                  className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5">
                {/* Request Snapshot */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-desert-atlas/30 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2 text-mountain-hostel/70">
                    <span className="font-bold uppercase tracking-wider text-[#1E5B43]">
                      {categoryLabel}
                    </span>
                    <span className="font-mono tabular-nums">
                      {request.start_date} &rarr; {request.end_date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-stone-700 pt-0.5">
                    <span>
                      From <strong>{request.traveler_country}</strong> · {request.adults} Adults
                      {request.children > 0 ? `, ${request.children} Kids` : ''}
                    </span>
                    <span className="font-bold text-safari-dusk font-mono tabular-nums shrink-0">
                      {request.currency} {request.budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Direct Copyable Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-safari-dusk flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-desert-atlas-dark" />
                    Direct Shareable Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#1E5B43] min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 min-h-[42px] cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1E5B43] hover:bg-[#154331] text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Social Media Platforms */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-safari-dusk">
                    Share directly on social media
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {socialPlatforms.map((platform) => (
                      <a
                        key={platform.name}
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[42px] ${platform.bgClass}`}
                      >
                        {platform.icon}
                        <span>{platform.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Native Device Share (Instagram, SMS, AirDrop, etc.) */}
                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full py-2.5 px-4 rounded-xl border border-desert-atlas/50 bg-desert-atlas-light/50 hover:bg-desert-atlas-light text-xs font-bold text-safari-dusk transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    More Sharing Apps (Instagram, SMS, etc.)
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          title="Share this travel request"
          aria-label={`Share ${request.title}`}
          className={`p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-[#1E5B43] hover:border-[#1E5B43]/50 hover:bg-emerald-50/50 transition-colors cursor-pointer inline-flex items-center justify-center ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        {modal}
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          title="Share this travel request"
          aria-label={`Share ${request.title}`}
          className={`px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:border-[#1E5B43] hover:text-[#1E5B43] text-stone-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 min-h-[34px] ${className}`}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span>Share</span>
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Share this travel request across social media"
        aria-label={`Share ${request.title}`}
        className={`px-3 py-2 rounded-xl border border-stone-300 bg-white hover:border-[#1E5B43] hover:text-[#1E5B43] text-stone-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 min-h-[40px] ${className}`}
      >
        <Share2 className="w-3.5 h-3.5 shrink-0" />
        <span>Share</span>
      </button>
      {modal}
    </>
  );
};
