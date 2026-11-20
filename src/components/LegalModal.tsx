import React, { useEffect, useRef } from 'react';
import { X, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
  onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  onAccept,
}) => {
  const privacySectionRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTab === 'privacy' && privacySectionRef.current) {
      privacySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-safari-dusk-dark/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-desert-atlas/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-desert-atlas/30 bg-desert-atlas-light">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-highlight-accent" />
            <h2 className="text-lg font-bold text-safari-dusk font-display">
              Terms of Use &amp; Privacy Notice
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-mountain-hostel/60 hover:text-safari-dusk rounded-lg hover:bg-desert-atlas/20 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close legal dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Combined Content: Terms of Use + Privacy Notice */}
        <div
          ref={scrollContainerRef}
          className="p-6 overflow-y-auto space-y-6 text-sm text-mountain-hostel leading-relaxed"
        >
          <div className="space-y-2 border-b border-desert-atlas/20 pb-4">
            <h3 className="text-xl font-bold text-safari-dusk font-display">
              Terms of Use: Travellers and Operators
            </h3>
            <p>
              These terms set the rules for using <strong>Elephantastic Safaris</strong> (the &ldquo;Platform&rdquo;), a marketplace where travellers post trip requests for safaris, tours, hotels and BnBs in Kenya, and verified Kenyan operators respond with offers. By creating an account or using the Platform, you agree to them. This is a draft template: have a Kenyan lawyer review it before you publish it.
            </p>
          </div>

          {/* 1. Definitions */}
          <section className="space-y-2">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              1. Definitions
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Traveller:</strong> a person who posts a request.
              </li>
              <li>
                <strong>Operator:</strong> a Kenyan business, such as a tour company, hotel or BnB host, that holds a profile on the Platform.
              </li>
              <li>
                <strong>Request (listing):</strong> a trip enquiry posted by a Traveller, including dates, group size and budget.
              </li>
              <li>
                <strong>Bid:</strong> a message from an Operator on a Request with a proposed amount, what is included and how long the offer is valid.
              </li>
              <li>
                <strong>Bidding Pass:</strong> a paid 24-hour pass that lets an Operator place Bids.
              </li>
              <li>
                <strong>Contact Unlock:</strong> a separate one-time paid action that gives an Operator a Traveller&apos;s email, WhatsApp and phone number for one Request.
              </li>
              <li>
                <strong>We, us:</strong> the company that runs the Platform.
              </li>
            </ul>
          </section>

          {/* 2. Terms for everyone */}
          <section className="space-y-2">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              2. Terms for everyone
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Eligibility.</strong> You must be 18 or older and able to enter a binding agreement.
              </li>
              <li>
                <strong>Accounts.</strong> Give accurate information, keep your login secure, and tell us if someone else uses your account. You are responsible for activity under it.
              </li>
              <li>
                <strong>Our role.</strong> We connect Travellers and Operators. We are not a travel agent, tour operator or hotel, and we are not a party to any booking. Any booking, price and trip is agreed directly between the Traveller and the Operator.
              </li>
              <li>
                <strong>Acceptable use.</strong> Do not post false, misleading or unlawful content, harass others, scrape data, bypass our fees, or use the Platform for spam, fraud or anything illegal.
              </li>
              <li>
                <strong>Content.</strong> You keep ownership of what you post. You give us permission to display it on the Platform and use it to run the service.
              </li>
              <li>
                <strong>Suspension.</strong> We may suspend or close accounts that break these terms, after notice where reasonable.
              </li>
              <li>
                <strong>Changes.</strong> We may update these terms. Continued use after an update means you accept it, and we will notify you of material changes.
              </li>
            </ul>
          </section>

          {/* 3. Terms for travellers */}
          <section className="space-y-3">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              3. Terms for travellers
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Free to use.</strong> Posting a Request and receiving Bids costs you nothing.
              </li>
              <li>
                <strong>Your Request.</strong> Provide honest details, including a budget. Your Request stays open for 7 days by default, and you can extend it, add more contact unlock slots or close it at any time.
              </li>
              <li>
                <strong>Bids.</strong> Operators can send unlimited Bids until you close the Request. Bids are visible only to you, not to other Operators. You alone decide whom to contact.
              </li>
              <li>
                <strong>Contact sharing.</strong> By posting, you agree that Operators who pay to unlock your Request may contact you directly by email, WhatsApp and phone. A maximum of 30 Operators can unlock one Request, and you can add more slots. You can turn unlocking off to receive Bids only, and you are notified in the Platform each time an Operator unlocks.
              </li>
              <li>
                <strong>Closing a Request.</strong> Closing stops new Bids and new unlocks.
              </li>
              <li>
                <strong>Your decisions.</strong> Check an Operator&apos;s licence, reviews and references before you pay them. Verified status means we checked documents, not that we guarantee any service.
              </li>
              <li>
                <strong>Payments to Operators.</strong> Any payment for a trip is made directly to the Operator and is outside the Platform. We do not hold or guarantee those funds.
              </li>
            </ul>

            <div className="bg-[#FAF8F5] rounded-xl border border-desert-atlas/30 p-4 space-y-2">
              <div className="font-bold text-safari-dusk text-sm">
                Disclaimer on operator verification.
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
                <li>
                  <strong>Ask for proof.</strong> Not every Operator on the Platform is verified, and it is not our responsibility to make sure they are. Only Operators with a Verified badge have paid for and passed our document check.
                </li>
                <li>
                  <strong>You must check.</strong> Before you contact, book with or pay any Operator, ask them to prove they are fully registered and licensed, for example their TRA licence and business registration, and confirm it independently.
                </li>
                <li>
                  <strong>No responsibility.</strong> We are not liable for losses that result from dealing with an Operator who is unverified, unlicensed or misrepresented themselves.
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Terms for operators */}
          <section className="space-y-3">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              4. Terms for operators
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Private profile.</strong> You must create a profile before you can bid or unlock. Your profile is visible only to you and our admins. Travellers see your business name, Verified badge and rating.
              </li>
              <li>
                <strong>Verification.</strong> We verify your Tourism Regulatory Authority (TRA) licence and business registration. You must keep them valid and tell us if they change. We may remove your Verified status or access if they lapse or are false.
              </li>
              <li>
                <strong>Bidding.</strong> A Bidding Pass costs KSH 850 and lasts 24 hours from payment. It covers all open Requests in the categories you chose. After it ends, bidding is locked until you pay again. You may send unlimited Bids while it is active.
              </li>
              <li>
                <strong>Bids must be honest.</strong> Quote real prices and inclusions you can deliver. A Bid is an offer on the terms you state, valid for the period you state. Do not use Bids to send your own contact details or move the conversation off the Platform before the Traveller chooses you.
              </li>
              <li>
                <strong>Contact Unlock.</strong> Unlocking is optional, separate from the pass, and does not need a pass. You pay a one-time fee per Request, set by the Traveller&apos;s budget. It gives you that Traveller&apos;s email, WhatsApp and phone number. A maximum of 30 Operators can unlock each Request.
              </li>
              <li>
                <strong>Use of contacts.</strong> Use a Traveller&apos;s details only to respond to that Request. Do not sell, share, add to marketing lists or contact them about anything else. You must follow the Kenya Data Protection Act, 2019, and the privacy law that applies to the Traveller.
              </li>
              <li>
                <strong>Your service.</strong> You, not the Platform, are responsible for the trips, stays and services you sell, including safety, licences, insurance and refunds to Travellers.
              </li>
            </ul>

            <div className="bg-[#FAF8F5] rounded-xl border border-desert-atlas/30 p-4 space-y-2">
              <div className="font-bold text-safari-dusk text-sm">
                Optional verification. Where this conflicts with &ldquo;Verification&rdquo; above, this applies.
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
                <li>
                  <strong>You may skip verification.</strong> When you create your profile, you can bypass the verification process and start using the Platform without it. Your profile then shows no Verified badge.
                </li>
                <li>
                  <strong>Paid verification, KSH 1,500 one time.</strong> If you want the Verified badge to build trust with Travellers, you can verify at any time for a one-time fee of KSH 1,500. We then check your TRA licence and business registration as described above.
                </li>
                <li>
                  <strong>Not refundable.</strong> The verification fee is non-refundable, including if we cannot verify your documents.
                </li>
                <li>
                  <strong>Unverified means unchecked.</strong> Operators who skip verification have not been checked by us, and we make no statement about their registration or licensing. They remain fully responsible for being lawfully registered and licensed.
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Payments and refunds */}
          <section className="space-y-3">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              5. Payments and refunds
            </h4>
            <p>
              Operators pay by M-Pesa in Kenyan shillings (KSH). Travellers pay us nothing. Fees are charged on payment and include any taxes we must collect.
            </p>
            <p className="font-semibold text-safari-dusk">
              Bidding Pass: KSH 850 for 24 hours.
            </p>
            <p>
              Contact Unlock fee, set by the Traveller&apos;s total budget converted to US dollars at a fixed rate we set and may update:
            </p>

            <div className="overflow-hidden rounded-xl border border-desert-atlas/30">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-desert-atlas-light text-safari-dusk border-b border-desert-atlas/30">
                    <th className="px-4 py-2.5 font-bold">Traveller budget (USD)</th>
                    <th className="px-4 py-2.5 font-bold">Unlock fee (KSH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-desert-atlas/20 bg-white">
                  <tr>
                    <td className="px-4 py-2">Under 2,000</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">120</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">2,000 to 4,999</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">300</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">5,000 to 9,999</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">600</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">10,000 to 19,999</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">1,200</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">20,000 to 49,999</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">2,500</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">50,000 and above</td>
                    <td className="px-4 py-2 font-mono font-bold text-safari-dusk">5,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Fee shown before you pay.</strong> If a Traveller changes their budget, only Operators who have not yet unlocked see the new fee.
              </li>
              <li>
                <strong>Slot hold.</strong> When you start an unlock, we hold a slot for about 2 minutes while you complete the M-Pesa prompt. Only completed payments count toward the limit of 30.
              </li>
              <li>
                <strong>Automatic refund.</strong> If your payment completes after the hold expires and the Request is already full, closed or has unlocking turned off, we refund you in full automatically.
              </li>
              <li>
                <strong>No other refunds.</strong> A Bidding Pass and a completed Contact Unlock are non-refundable, because access is given immediately. If you were charged and did not receive what you paid for, contact us within 7 days and we will correct it or refund you.
              </li>
              <li>
                <strong>Failed payments.</strong> If M-Pesa does not confirm a payment, you are not charged, and we show it as failed in your history.
              </li>
              <li>
                <strong>Fee changes.</strong> We may change fees with notice. Changes do not affect passes or unlocks already paid.
              </li>
            </ul>
          </section>

          {/* 6. Privacy, liability and disputes */}
          <section ref={privacySectionRef} className="space-y-3">
            <h4 className="font-bold text-safari-dusk text-base font-display">
              6. Privacy, liability and disputes
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
              <li>
                <strong>Privacy.</strong> We collect only what we need to run the Platform and handle personal data under the Kenya Data Protection Act, 2019, and, for travellers in the UK and EU, the GDPR. Our Privacy Notice below explains what we collect, why, who sees it and how to ask for access or deletion.
              </li>
              <li>
                <strong>No guarantees.</strong> The Platform is provided &ldquo;as is&rdquo;. We do not guarantee Bids, bookings, Operator quality, availability or prices, and we are not responsible for what happens on a trip.
              </li>
              <li>
                <strong>Limit of liability.</strong> To the extent the law allows, our liability to you is limited to the fees you paid us in the 3 months before the claim. Nothing limits liability that cannot be limited by law.
              </li>
              <li>
                <strong>Indemnity.</strong> You agree to cover losses we suffer because you broke these terms or the law.
              </li>
              <li>
                <strong>Disputes between users.</strong> Travellers and Operators should resolve disputes between themselves first. We may help by passing on messages, but we do not decide or pay out claims.
              </li>
              <li>
                <strong>Reports.</strong> Report a profile, Request or Bid that breaks these terms using the contact below.
              </li>
              <li>
                <strong>Governing law.</strong> These terms are governed by the laws of Kenya. Disputes go first to good-faith negotiation, then to the courts of Kenya.
              </li>
            </ul>

            <div className="bg-[#FAF8F5] rounded-xl border border-desert-atlas/30 p-4 space-y-2">
              <div className="font-bold text-safari-dusk text-sm">
                Privacy Notice &amp; Data Protection (Kenya DPA 2019 &amp; UK/EU GDPR)
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-mountain-hostel/90">
                <li>
                  <strong>Contact Concealment:</strong> Traveller emails, WhatsApp numbers, and phone numbers remain hidden from Operators unless unlocked through a completed one-time Contact Unlock or explicitly shared by the Traveller.
                </li>
                <li>
                  <strong>Permitted Contact Use:</strong> Operators may use unlocked contact details solely to respond to that specific Request and must not sell, share, or add Travellers to marketing lists.
                </li>
                <li>
                  <strong>Private Operator Profiles:</strong> Operator profile records, TRA licences, and business registration uploads are visible only to the Operator and platform administrators.
                </li>
                <li>
                  <strong>Access &amp; Deletion:</strong> Any Traveller or Operator may request access to or deletion of their account records at any time.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-desert-atlas/30 bg-desert-atlas-light/50 flex items-center justify-end gap-3">
          {onAccept ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-mountain-hostel hover:text-safari-dusk rounded-xl border border-desert-atlas/40 bg-white hover:bg-desert-atlas-light transition-colors min-h-[44px] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors min-h-[44px] cursor-pointer"
              >
                Accept Terms of Use
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors min-h-[44px] cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
