import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TravelCategory, Currency } from '../types';
import { Trees, Building2, Home as HomeIcon, X, Check, Shield, AlertCircle, Compass, MessageCircle, PhoneCall, Mail, Lock } from 'lucide-react';

interface PostRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillRequest?: any;
}

export const PostRequestModal: React.FC<PostRequestModalProps> = ({
  isOpen,
  onClose,
  prefillRequest,
}) => {
  const { currentUser, createTravelRequest } = useApp();

  const [category, setCategory] = useState<TravelCategory>(
    prefillRequest?.category || 'safari'
  );

  // Common fields
  const [title, setTitle] = useState(prefillRequest?.title || '');
  const [startDate, setStartDate] = useState(prefillRequest?.start_date || '2026-12-15');
  const [endDate, setEndDate] = useState(prefillRequest?.end_date || '2026-12-22');
  const [flexibleMonth, setFlexibleMonth] = useState(prefillRequest?.flexible_month || '');
  const [adults, setAdults] = useState<number>(prefillRequest?.adults || 2);
  const [children, setChildren] = useState<number>(prefillRequest?.children || 0);
  const [budget, setBudget] = useState<number>(prefillRequest?.budget || 3500);
  const [currency, setCurrency] = useState<Currency>(
    currentUser?.preferred_currency || prefillRequest?.currency || 'USD'
  );
  const [notes, setNotes] = useState(prefillRequest?.notes || '');

  // Contact fields (WhatsApp number, Call number, Email address)
  const [whatsappNumber, setWhatsappNumber] = useState(
    prefillRequest?.whatsapp_number || currentUser?.phone || '+44 7700 900123'
  );
  const [callNumber, setCallNumber] = useState(
    prefillRequest?.call_number || currentUser?.phone || '+44 7700 900123'
  );
  const [emailAddress, setEmailAddress] = useState(
    prefillRequest?.email_address || currentUser?.email || 'traveler@example.com'
  );
  const [preferredContactMethod, setPreferredContactMethod] = useState<'whatsapp' | 'email' | 'phone'>(
    prefillRequest?.preferred_contact_method || 'whatsapp'
  );
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);

  // Safari fields
  const [safariDays, setSafariDays] = useState(prefillRequest?.safari_details?.days || 7);
  const [selectedParks, setSelectedParks] = useState<string[]>(
    prefillRequest?.safari_details?.parks || ['Maasai Mara National Reserve', 'Amboseli National Park']
  );
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    prefillRequest?.safari_details?.activities || ['Game Drives', 'Hot Air Balloon Safari']
  );
  const [accommodationLevel, setAccommodationLevel] = useState<'budget' | 'mid-range' | 'luxury'>(
    prefillRequest?.safari_details?.accommodation_level || 'luxury'
  );
  const [airportPickup, setAirportPickup] = useState(
    prefillRequest?.safari_details?.airport_pickup ?? true
  );
  const [vehicleType, setVehicleType] = useState<'private_4x4' | 'shared_van'>(
    prefillRequest?.safari_details?.vehicle_type || 'private_4x4'
  );

  // Hotel fields
  const [hotelDestination, setHotelDestination] = useState(
    prefillRequest?.hotel_details?.destination || 'Nairobi (Westlands / Karen)'
  );
  const [hotelRooms, setHotelRooms] = useState(prefillRequest?.hotel_details?.rooms || 1);
  const [hotelRoomType, setHotelRoomType] = useState(
    prefillRequest?.hotel_details?.room_type || 'Deluxe King or Suite'
  );
  const [hotelStarRating, setHotelStarRating] = useState(
    prefillRequest?.hotel_details?.star_rating || '4-Star / 5-Star Boutique'
  );
  const [hotelMealPlan, setHotelMealPlan] = useState<any>(
    prefillRequest?.hotel_details?.meal_plan || 'bed_and_breakfast'
  );
  const [hotelAmenities, setHotelAmenities] = useState<string[]>(
    prefillRequest?.hotel_details?.amenities || ['Swimming Pool', 'High Speed WiFi', 'Airport Shuttle']
  );

  // BnB fields
  const [bnbNeighbourhood, setBnbNeighbourhood] = useState(
    prefillRequest?.bnb_details?.neighbourhood || 'Diani Beach or Galu'
  );
  const [bnbBedrooms, setBnbBedrooms] = useState(prefillRequest?.bnb_details?.bedrooms || 3);
  const [bnbPlaceType, setBnbPlaceType] = useState<'entire_place' | 'private_room'>(
    prefillRequest?.bnb_details?.place_type || 'entire_place'
  );
  const [bnbAmenities, setBnbAmenities] = useState<string[]>(
    prefillRequest?.bnb_details?.amenities || ['Kitchen / Self-Catering', 'Private Pool', 'Dedicated Workspace']
  );
  const [selfCheckIn, setSelfCheckIn] = useState(
    prefillRequest?.bnb_details?.self_check_in ?? true
  );

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) {
      errs.title = 'Please enter a title describing your trip request.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }

    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }
    if (!endDate) {
      errs.endDate = 'End date is required.';
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errs.endDate = 'End date cannot be earlier than start date.';
    }

    if (!budget || budget <= 0) {
      errs.budget = 'Please enter a valid total budget.';
    }

    if (adults < 1) {
      errs.adults = 'At least 1 adult traveler is required.';
    }

    if (category === 'safari' && selectedParks.length === 0) {
      errs.parks = 'Please select at least one park or region in Kenya.';
    }

    if (category === 'hotel' && !hotelDestination.trim()) {
      errs.destination = 'Town or destination is required.';
    }

    if (category === 'bnb' && !bnbNeighbourhood.trim()) {
      errs.neighbourhood = 'Neighbourhood or town is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleTogglePark = (park: string) => {
    setSelectedParks((prev) =>
      prev.includes(park) ? prev.filter((p) => p !== park) : [...prev, park]
    );
  };

  const handleToggleActivity = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleToggleHotelAmenity = (amenity: string) => {
    setHotelAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleToggleBnbAmenity = (amenity: string) => {
    setBnbAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload: any = {
      category,
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      flexible_month: flexibleMonth || undefined,
      adults: Number(adults),
      children: Number(children),
      budget: Number(budget),
      currency,
      notes: notes.trim() || 'No additional notes provided.',
      whatsapp_number: whatsappNumber.trim(),
      call_number: (sameAsWhatsapp ? whatsappNumber : callNumber).trim(),
      email_address: emailAddress.trim(),
      preferred_contact_method: preferredContactMethod,
    };

    if (category === 'safari') {
      payload.safari_details = {
        days: safariDays,
        parks: selectedParks,
        activities: selectedActivities,
        accommodation_level: accommodationLevel,
        airport_pickup: airportPickup,
        vehicle_type: vehicleType,
      };
    } else if (category === 'hotel') {
      payload.hotel_details = {
        destination: hotelDestination,
        rooms: hotelRooms,
        room_type: hotelRoomType,
        star_rating: hotelStarRating,
        meal_plan: hotelMealPlan,
        amenities: hotelAmenities,
      };
    } else if (category === 'bnb') {
      payload.bnb_details = {
        neighbourhood: bnbNeighbourhood,
        bedrooms: bnbBedrooms,
        place_type: bnbPlaceType,
        amenities: bnbAmenities,
        self_check_in: selfCheckIn,
      };
    }

    createTravelRequest(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-safari-dusk/70 backdrop-blur-xs">
      <div className="bg-[#FAF8F5] w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-[#E2DED3] animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="bg-[#1E5B43] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Compass className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">
                {prefillRequest ? 'Re-Post Travel Request' : 'Post a Request'}
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Free to post. Verified Kenyan operators bid privately.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Category Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2F4858] mb-2">
              1. Choose Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCategory('safari')}
                className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all min-h-[44px] ${
                  category === 'safari'
                    ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] ring-1 ring-[#1E5B43]'
                    : 'border-[#E2DED3] bg-white text-[#2F4858] hover:border-[#CDAA7D]'
                }`}
              >
                <Trees className="w-5 h-5 text-[#1E5B43]" />
                <span className="text-xs font-bold font-display">Safari &amp; Tours</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('hotel')}
                className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all min-h-[44px] ${
                  category === 'hotel'
                    ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] ring-1 ring-[#1E5B43]'
                    : 'border-[#E2DED3] bg-white text-[#2F4858] hover:border-[#CDAA7D]'
                }`}
              >
                <Building2 className="w-5 h-5 text-[#1E5B43]" />
                <span className="text-xs font-bold font-display">Hotels &amp; Lodges</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('bnb')}
                className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all min-h-[44px] ${
                  category === 'bnb'
                    ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] ring-1 ring-[#1E5B43]'
                    : 'border-[#E2DED3] bg-white text-[#2F4858] hover:border-[#CDAA7D]'
                }`}
              >
                <HomeIcon className="w-5 h-5 text-[#1E5B43]" />
                <span className="text-xs font-bold font-display">BnBs &amp; Villas</span>
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#2F4858] mb-1">
                Trip Request Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                className={`w-full text-sm rounded-xl border px-3.5 py-2.5 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium ${
                  errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E2DED3] focus:border-[#1E5B43]'
                }`}
                placeholder="e.g. 7-Day Maasai Mara Migration Safari for Couple with Balloon Ride"
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                </p>
              )}
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                  Check-in / Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                  Check-out / End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium"
                />
                {errors.endDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                Flexible Month <span className="text-[#2F4858]/60 font-normal">(Optional if dates are flexible)</span>
              </label>
              <input
                type="text"
                value={flexibleMonth}
                onChange={(e) => setFlexibleMonth(e.target.value)}
                className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-white text-[#2F4858] outline-hidden font-medium"
                placeholder="e.g. Any week in August or September 2026"
              />
            </div>

            {/* Group Size & Budget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">Adults</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">Children</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">Total Budget</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-white text-[#2F4858] outline-hidden min-h-[44px] font-medium font-mono"
                />
              </div>
            </div>
            {errors.budget && (
              <p className="text-xs text-red-600">{errors.budget}</p>
            )}
          </div>

          {/* Step 2: Category-Specific Fields */}
          {category === 'safari' && (
            <div className="bg-white p-5 rounded-2xl border border-[#E2DED3] space-y-4">
              <h3 className="text-sm font-bold text-[#1E5B43] uppercase tracking-wide">
                Safari &amp; Tour Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                    Number of Safari Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={safariDays}
                    onChange={(e) => setSafariDays(Number(e.target.value))}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5] text-[#2F4858] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                    Accommodation Level
                  </label>
                  <select
                    value={accommodationLevel}
                    onChange={(e) => setAccommodationLevel(e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5] text-[#2F4858]"
                  >
                    <option value="budget">Budget / Mid-Camp</option>
                    <option value="mid-range">Mid-Range Safari Lodge</option>
                    <option value="luxury">Luxury Tented Camp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                  Parks &amp; Regions to Cover *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Maasai Mara National Reserve',
                    'Amboseli National Park',
                    'Lake Nakuru / Naivasha',
                    'Tsavo East & West',
                    'Samburu Game Reserve',
                    'Diani Beach Coastal Add-on',
                  ].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => handleTogglePark(p)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        selectedParks.includes(p)
                          ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] font-semibold'
                          : 'border-[#E2DED3] text-[#2F4858]/80 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{p}</span>
                      {selectedParks.includes(p) && <Check className="w-3.5 h-3.5 shrink-0 text-[#1E5B43]" />}
                    </button>
                  ))}
                </div>
                {errors.parks && <p className="text-xs text-red-600 mt-1">{errors.parks}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                  Activities
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Game Drives',
                    'Hot Air Balloon Safari',
                    'Cultural Maasai Village Visit',
                    'Guided Bush Walking Safari',
                    'Boat Safari (Naivasha)',
                    'Coastal Beach Relaxation',
                  ].map((act) => (
                    <button
                      type="button"
                      key={act}
                      onClick={() => handleToggleActivity(act)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        selectedActivities.includes(act)
                          ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] font-semibold'
                          : 'border-[#E2DED3] text-[#2F4858]/80 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{act}</span>
                      {selectedActivities.includes(act) && <Check className="w-3.5 h-3.5 shrink-0 text-[#1E5B43]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                    Vehicle Preference
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5] text-[#2F4858]"
                  >
                    <option value="private_4x4">Custom 4x4 Land Cruiser (Pop-up roof)</option>
                    <option value="shared_van">Shared Safari Tour Van</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="airportPickup"
                    checked={airportPickup}
                    onChange={(e) => setAirportPickup(e.target.checked)}
                    className="w-4 h-4 text-[#1E5B43] rounded"
                  />
                  <label htmlFor="airportPickup" className="text-xs font-medium text-[#2F4858]">
                    Include Airport Pickup (NBO / MBA)
                  </label>
                </div>
              </div>
            </div>
          )}

          {category === 'hotel' && (
            <div className="bg-white p-5 rounded-2xl border border-[#E2DED3] space-y-4">
              <h3 className="text-sm font-bold text-[#1E5B43] uppercase tracking-wide">
                Hotel &amp; Resort Specifications
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                  Town or Destination in Kenya *
                </label>
                <input
                  type="text"
                  value={hotelDestination}
                  onChange={(e) => setHotelDestination(e.target.value)}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5] text-[#2F4858]"
                  placeholder="e.g. Nairobi (Westlands), Mombasa, or Naivasha"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">Rooms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={hotelRooms}
                    onChange={(e) => setHotelRooms(Number(e.target.value))}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-[#FAF8F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">Room Type</label>
                  <input
                    type="text"
                    value={hotelRoomType}
                    onChange={(e) => setHotelRoomType(e.target.value)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">Meal Plan</label>
                  <select
                    value={hotelMealPlan}
                    onChange={(e) => setHotelMealPlan(e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3 py-2 bg-[#FAF8F5]"
                  >
                    <option value="bed_and_breakfast">Bed &amp; Breakfast</option>
                    <option value="half_board">Half Board</option>
                    <option value="full_board">Full Board</option>
                    <option value="all_inclusive">All-Inclusive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                  Must-Haves
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Swimming Pool', 'High Speed WiFi', 'Airport Shuttle', 'Gym / Spa', 'Ocean / Lake View'].map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => handleToggleHotelAmenity(item)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        hotelAmenities.includes(item)
                          ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] font-semibold'
                          : 'border-[#E2DED3] text-[#2F4858]/80'
                      }`}
                    >
                      <span>{item}</span>
                      {hotelAmenities.includes(item) && <Check className="w-3.5 h-3.5 text-[#1E5B43]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {category === 'bnb' && (
            <div className="bg-white p-5 rounded-2xl border border-[#E2DED3] space-y-4">
              <h3 className="text-sm font-bold text-[#1E5B43] uppercase tracking-wide">
                BnB &amp; Vacation Villa Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                    Town or Neighbourhood in Kenya *
                  </label>
                  <input
                    type="text"
                    value={bnbNeighbourhood}
                    onChange={(e) => setBnbNeighbourhood(e.target.value)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5]"
                    placeholder="e.g. Diani Beach, Kilimani Nairobi, or Watamu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                    Place Type
                  </label>
                  <select
                    value={bnbPlaceType}
                    onChange={(e) => setBnbPlaceType(e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5]"
                  >
                    <option value="entire_place">Entire Villa / Apartment</option>
                    <option value="private_room">Private En-suite Room</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1">
                  Bedrooms Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={bnbBedrooms}
                  onChange={(e) => setBnbBedrooms(Number(e.target.value))}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2 bg-[#FAF8F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                  Must-Haves
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Kitchen / Self-Catering', 'Private Pool', 'Dedicated Workspace', 'Free Parking', 'Beachfront Access', 'Air Conditioning'].map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => handleToggleBnbAmenity(item)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        bnbAmenities.includes(item)
                          ? 'border-[#1E5B43] bg-emerald-50 text-[#1E5B43] font-semibold'
                          : 'border-[#E2DED3] text-[#2F4858]/80'
                      }`}
                    >
                      <span>{item}</span>
                      {bnbAmenities.includes(item) && <Check className="w-3.5 h-3.5 text-[#1E5B43]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="selfCheckIn"
                  checked={selfCheckIn}
                  onChange={(e) => setSelfCheckIn(e.target.checked)}
                  className="w-4 h-4 text-[#1E5B43] rounded"
                />
                <label htmlFor="selfCheckIn" className="text-xs font-medium text-[#2F4858]">
                  Require Self-Check-in (Keypad / Lockbox)
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Communication Details */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DED3] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DED3] pb-2.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#1E5B43]" />
                <h3 className="text-sm font-bold text-[#1E5B43] uppercase tracking-wide">
                  Contact Details (WhatsApp, Call &amp; Email)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-700" />
                Private
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                    if (sameAsWhatsapp) setCallNumber(e.target.value);
                  }}
                  placeholder="+44 7700 900123"
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#FAF8F5] text-[#2F4858] font-medium outline-hidden focus:border-[#1E5B43] min-h-[44px]"
                />
                <span className="text-[11px] text-[#2F4858]/70 mt-1 block">
                  For fast WhatsApp chat and itinerary proposals.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#2F4858] flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-[#1E5B43]" />
                    Call Number (Voice Phone)
                  </label>
                  <label className="text-[11px] text-[#2F4858]/70 flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsWhatsapp}
                      onChange={(e) => {
                        setSameAsWhatsapp(e.target.checked);
                        if (e.target.checked) setCallNumber(whatsappNumber);
                      }}
                      className="w-3.5 h-3.5 text-[#1E5B43] rounded"
                    />
                    Same as WhatsApp
                  </label>
                </div>
                <input
                  type="tel"
                  value={sameAsWhatsapp ? whatsappNumber : callNumber}
                  disabled={sameAsWhatsapp}
                  onChange={(e) => setCallNumber(e.target.value)}
                  placeholder="+44 7700 900123"
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#FAF8F5] text-[#2F4858] disabled:opacity-70 font-medium outline-hidden focus:border-[#1E5B43] min-h-[44px]"
                />
                <span className="text-[11px] text-[#2F4858]/70 mt-1 block">
                  Direct voice phone consultations or briefing.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#2F4858]" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="traveler@example.com"
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#FAF8F5] text-[#2F4858] font-medium outline-hidden focus:border-[#1E5B43] min-h-[44px]"
                />
                <span className="text-[11px] text-[#2F4858]/70 mt-1 block">
                  For formal PDF quotes and confirmations.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F4858] mb-1.5">
                  Preferred Contact Channel
                </label>
                <select
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value as any)}
                  className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-[#FAF8F5] text-[#2F4858] font-medium outline-hidden focus:border-[#1E5B43] min-h-[44px]"
                >
                  <option value="whatsapp">WhatsApp (Instant Messaging)</option>
                  <option value="email">Email (Detailed Proposals)</option>
                  <option value="phone">Direct Phone Call</option>
                </select>
                <span className="text-[11px] text-[#2F4858]/70 mt-1 block">
                  Preferred method for operators to initiate contact.
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#1E5B43] shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-950 leading-relaxed">
                <span className="font-bold text-[#1E5B43]">Privacy Guaranteed:</span> Numbers and email are never shown publicly on the marketplace. Operators only see your trip details until you choose to connect.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#2F4858] mb-1">
              Trip Notes &amp; Special Requests
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#E2DED3] px-3.5 py-2.5 bg-white text-[#2F4858] outline-hidden font-medium"
              placeholder="Tell operators any specific interests: dietary preferences, photography goals, children's ages, anniversary celebrations, etc."
            />
          </div>

          {/* Review & Defaults Callout */}
          <div className="bg-[#FAF8F5] rounded-xl border border-[#E2DED3] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E5B43]">
              <Shield className="w-4 h-4 text-[#1E5B43]" />
              <span>Defaults &amp; Bid Privacy Rules</span>
            </div>
            <ul className="text-xs text-[#2F4858]/80 space-y-1 list-disc pl-5">
              <li>Opens immediately with <strong>30 bid slots</strong> and remains open for <strong>7 days</strong>.</li>
              <li>Operators never see each other's bids or quote prices.</li>
              <li>Your contact info is completely hidden. Only you choose whom to talk to.</li>
            </ul>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-[#E2DED3] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#2F4858] hover:text-[#1E5B43] rounded-xl min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#174834] rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              {prefillRequest ? 'Re-Post Request' : 'Review & Post for Free'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
