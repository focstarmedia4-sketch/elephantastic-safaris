import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TravelCategory, Currency } from '../../types';
import { ALL_COUNTRIES } from '../../data/countries';
import { Compass, Lock, Mail, MessageCircle, PhoneCall, ArrowRight, AlertCircle, Check } from 'lucide-react';

export const PostRequestPage: React.FC = () => {
  const { currentUser, createTravelRequest, setActiveTab, tabParam, openAuthPrompt } = useApp();

  // Category (can be prefilled via tabParam)
  const initialCategory: TravelCategory =
    tabParam === 'safari' || tabParam === 'hotel' || tabParam === 'bnb'
      ? (tabParam as TravelCategory)
      : 'safari';

  const [category] = useState<TravelCategory>(initialCategory);

  // Common fields
  const [title, setTitle] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2026-12-15');
  const [endDate, setEndDate] = useState('2026-12-22');
  const [flexibleMonth, setFlexibleMonth] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState(3500);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [notes, setNotes] = useState('');

  // Contact fields (WhatsApp, Call number, Email address)
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.phone || '+44 7700 900123');
  const [callNumber, setCallNumber] = useState(currentUser?.phone || '+44 7700 900123');
  const [emailAddress, setEmailAddress] = useState(currentUser?.email || 'traveler@example.com');
  const [preferredContactMethods, setPreferredContactMethods] = useState<('whatsapp' | 'email' | 'phone')[]>(['whatsapp']);
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);

  // Safari fields
  const [safariDays, setSafariDays] = useState(7);
  const [selectedParks, setSelectedParks] = useState<string[]>([
    'Maasai Mara National Reserve',
    'Amboseli National Park',
  ]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    'Game Drives',
    'Cultural Maasai Village Visit',
  ]);
  const [accommodationLevel, setAccommodationLevel] = useState<'budget' | 'mid-range' | 'luxury'>('luxury');
  const [airportPickup, setAirportPickup] = useState(true);
  const [vehicleType, setVehicleType] = useState<'private_4x4' | 'shared_van'>('private_4x4');

  // Hotel fields
  const [hotelDestination, setHotelDestination] = useState('Nairobi (Westlands / Gigiri)');
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelRoomType, setHotelRoomType] = useState('Deluxe King or Suite');
  const [hotelStarRating, setHotelStarRating] = useState('4-Star / 5-Star Boutique');
  const [hotelMealPlan, setHotelMealPlan] = useState<any>('bed_and_breakfast');
  const [hotelAmenities, setHotelAmenities] = useState<string[]>([
    'Swimming Pool',
    'High Speed WiFi',
    'Airport Shuttle',
  ]);

  // BnB fields
  const [bnbNeighbourhood, setBnbNeighbourhood] = useState('Diani Beach or Galu');
  const [bnbBedrooms, setBnbBedrooms] = useState(3);
  const [bnbPlaceType, setBnbPlaceType] = useState<'entire_place' | 'private_room'>('entire_place');
  const [bnbAmenities, setBnbAmenities] = useState<string[]>([
    'Private Swimming Pool',
    'In-House Private Chef',
    'High-Speed WiFi',
  ]);
  const [bnbSelfCheckIn, setBnbSelfCheckIn] = useState(true);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCountry = countryOfOrigin.trim();
    if (!trimmedCountry) {
      setFormError('Please enter your Country of Origin before publishing your request.');
      return;
    }

    if (preferredContactMethods.length === 0) {
      setFormError('Please tick at least one preferred contact method.');
      return;
    }

    let defaultTitle = title.trim();
    if (!defaultTitle) {
      if (category === 'safari') {
        defaultTitle = `${safariDays}-Day Safari in ${selectedParks.slice(0, 2).join(' & ')}`;
      } else if (category === 'hotel') {
        defaultTitle = `${hotelStarRating} Stay in ${hotelDestination}`;
      } else {
        defaultTitle = `${bnbBedrooms}-Bed ${bnbPlaceType === 'entire_place' ? 'Entire Villa/Cottage' : 'Private Room'} in ${bnbNeighbourhood}`;
      }
    }

    const newId = createTravelRequest({
      category,
      title: defaultTitle,
      traveler_country: trimmedCountry,
      start_date: startDate,
      end_date: endDate,
      flexible_month: flexibleMonth || undefined,
      adults,
      children,
      budget,
      currency,
      notes: notes || 'Looking forward to receiving competitive quotes from verified Kenyan operators.',
      whatsapp_number: whatsappNumber.trim(),
      call_number: (sameAsWhatsapp ? whatsappNumber : callNumber).trim(),
      email_address: emailAddress.trim(),
      preferred_contact_method: preferredContactMethods[0] || 'whatsapp',
      preferred_contact_methods: preferredContactMethods,
      safari_details:
        category === 'safari'
          ? {
              days: safariDays,
              parks: selectedParks,
              activities: selectedActivities,
              accommodation_level: accommodationLevel,
              airport_pickup: airportPickup,
              vehicle_type: vehicleType,
            }
          : undefined,
      hotel_details:
        category === 'hotel'
          ? {
              destination: hotelDestination,
              rooms: hotelRooms,
              room_type: hotelRoomType,
              star_rating: hotelStarRating,
              meal_plan: hotelMealPlan,
              amenities: hotelAmenities,
            }
          : undefined,
      bnb_details:
        category === 'bnb'
          ? {
              neighbourhood: bnbNeighbourhood,
              bedrooms: bnbBedrooms,
              place_type: bnbPlaceType,
              amenities: bnbAmenities,
              self_check_in: bnbSelfCheckIn,
            }
          : undefined,
    });

    // Navigate to request detail
    setActiveTab('traveler-request-detail', newId);
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-desert-atlas-light rounded-2xl flex items-center justify-center mx-auto text-highlight-accent">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-safari-dusk font-display">
            Register or Sign Up First
          </h2>
          <p className="text-xs sm:text-sm text-mountain-hostel/80 leading-relaxed">
            Please register or sign in with your email and password to create custom Kenya travel requests and receive direct private bids from verified Kenyan operators.
          </p>
        </div>
        <button
          onClick={() => openAuthPrompt('traveler', 'traveler-post', tabParam || undefined, 'Post a Request')}
          className="w-full py-3 px-4 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          Register or Sign In Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
          Post for Free · Verified Kenyan Bidders
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
          Create your custom Kenya travel request
        </h1>
        <p className="text-xs sm:text-sm text-mountain-hostel/80">
          Your request will be open for 7 days and accepts up to 30 private bids. Your personal phone and email remain private.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Dates, Party & Budget */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Request Title (or leave blank to auto-generate)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 7-Day Maasai Mara Great Migration & Amboseli Family Safari"
                className="w-full text-sm rounded-lg border border-stone-300 px-3.5 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Country of Origin *
              </label>
              <input
                type="text"
                list="origin-countries"
                required
                value={countryOfOrigin}
                onChange={(e) => {
                  setCountryOfOrigin(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. United Kingdom"
                className="w-full text-sm rounded-lg border border-stone-300 px-3.5 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
              <datalist id="origin-countries">
                {ALL_COUNTRIES.map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Or Flexible Month (Optional)
              </label>
              <input
                type="text"
                value={flexibleMonth}
                onChange={(e) => setFlexibleMonth(e.target.value)}
                placeholder="e.g. Flexible in Dec 2026"
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Adults (Age 12+)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Children (Under 12)
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Total Target Budget
              </label>
              <input
                type="number"
                min={100}
                step={50}
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
              >
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="KSH">KSH (KES)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Category Adaptive Fields */}
        {category === 'safari' && (
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Duration (Number of Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={safariDays}
                  onChange={(e) => setSafariDays(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Accommodation Level
                </label>
                <select
                  value={accommodationLevel}
                  onChange={(e) => setAccommodationLevel(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                >
                  <option value="luxury">Luxury Tented Camps &amp; Lodges</option>
                  <option value="mid-range">Mid-Range Safari Lodges</option>
                  <option value="budget">Budget / Adventure Camping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Safari Vehicle
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                >
                  <option value="private_4x4">Private 4x4 Land Cruiser (Pop-up roof)</option>
                  <option value="shared_van">Shared Safari Minivan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Parks &amp; Regions of Interest (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Maasai Mara National Reserve',
                  'Amboseli National Park',
                  'Lake Nakuru & Naivasha',
                  'Tsavo East & West',
                  'Samburu National Reserve',
                  'Ol Pejeta Conservancy',
                  'Diani Beach Add-on',
                ].map((park) => {
                  const active = selectedParks.includes(park);
                  return (
                    <button
                      type="button"
                      key={park}
                      onClick={() => toggleArrayItem(selectedParks, setSelectedParks, park)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-desert-atlas-light border-desert-atlas text-safari-dusk font-bold shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-desert-atlas/50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{park}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Activities Desired
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Game Drives',
                  'Hot Air Balloon Safari',
                  'Cultural Maasai Village Visit',
                  'Walking Bush Safari',
                  'Night Game Drive',
                  'Bird Watching',
                ].map((act) => {
                  const active = selectedActivities.includes(act);
                  return (
                    <button
                      type="button"
                      key={act}
                      onClick={() => toggleArrayItem(selectedActivities, setSelectedActivities, act)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-desert-atlas-light border-desert-atlas text-safari-dusk font-bold shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-desert-atlas/50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{act}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pickup"
                checked={airportPickup}
                onChange={(e) => setAirportPickup(e.target.checked)}
                className="rounded border-stone-300 text-highlight-accent focus:ring-highlight-accent"
              />
              <label htmlFor="pickup" className="text-xs text-stone-700">
                Include complimentary Nairobi airport pickup (JKIA / Wilson Airport)
              </label>
            </div>
          </div>
        )}

        {category === 'hotel' && (
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Town or Destination
                </label>
                <input
                  type="text"
                  required
                  value={hotelDestination}
                  onChange={(e) => setHotelDestination(e.target.value)}
                  placeholder="e.g. Nairobi, Mombasa, Naivasha"
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Rooms &amp; Room Type
                </label>
                <input
                  type="text"
                  value={hotelRoomType}
                  onChange={(e) => setHotelRoomType(e.target.value)}
                  placeholder="e.g. 2 Executive Double Rooms"
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Meal Plan
                </label>
                <select
                  value={hotelMealPlan}
                  onChange={(e) => setHotelMealPlan(e.target.value)}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                >
                  <option value="bed_and_breakfast">Bed &amp; Breakfast</option>
                  <option value="half_board">Half Board (Breakfast + Dinner)</option>
                  <option value="full_board">Full Board (All Meals)</option>
                  <option value="all_inclusive">All-Inclusive (Meals + Beverages)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Must-Have Hotel Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Swimming Pool',
                  'High Speed WiFi',
                  'Airport Shuttle',
                  'Fitness Center / Gym',
                  'Business Center',
                  'Ocean / Waterhole View',
                  '24-Hour Room Service',
                ].map((amenity) => {
                  const active = hotelAmenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleArrayItem(hotelAmenities, setHotelAmenities, amenity)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-desert-atlas-light border-desert-atlas text-safari-dusk font-bold shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-desert-atlas/50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {category === 'bnb' && (
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Town or Neighbourhood
                </label>
                <input
                  type="text"
                  required
                  value={bnbNeighbourhood}
                  onChange={(e) => setBnbNeighbourhood(e.target.value)}
                  placeholder="e.g. Diani Beach, Karen, Westlands"
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Bedrooms Required
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={bnbBedrooms}
                  onChange={(e) => setBnbBedrooms(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Space Type
                </label>
                <select
                  value={bnbPlaceType}
                  onChange={(e) => setBnbPlaceType(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-stone-300 px-3 py-2 bg-white text-stone-900"
                >
                  <option value="entire_place">Entire Place (Exclusive Villa / Apartment)</option>
                  <option value="private_room">Private Room in Hosted Property</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Must-Haves (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Private Swimming Pool',
                  'In-House Private Chef',
                  'Fully Equipped Kitchen',
                  'High-Speed WiFi & Workspace',
                  'Free Secure Parking',
                  'Air Conditioning',
                  'Power Backup / Inverter',
                  'Direct Beach / Lake Access',
                ].map((amenity) => {
                  const active = bnbAmenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleArrayItem(bnbAmenities, setBnbAmenities, amenity)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-desert-atlas-light border-desert-atlas text-safari-dusk font-bold shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-desert-atlas/50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="selfCheck"
                checked={bnbSelfCheckIn}
                onChange={(e) => setBnbSelfCheckIn(e.target.checked)}
                className="rounded border-stone-300 text-highlight-accent focus:ring-highlight-accent"
              />
              <label htmlFor="selfCheck" className="text-xs text-stone-700">
                Self check-in keypad or smartlock required
              </label>
            </div>
          </div>
        )}

        {/* Contact & Communication Details */}
        <div className="space-y-4 pt-6 border-t border-desert-atlas/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <p className="text-xs text-mountain-hostel/80">
                Provide your WhatsApp number, phone number for voice calls, and email address to receive custom quotes.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-700" />
              Private &amp; Confidential
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  if (sameAsWhatsapp) {
                    setCallNumber(e.target.value);
                  }
                }}
                placeholder="+44 7700 900123"
                className="w-full text-sm rounded-xl border border-desert-atlas/40 px-3.5 py-2.5 bg-white text-safari-dusk font-medium focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
              <span className="text-[11px] text-mountain-hostel/70 mt-1 block">
                Primary channel for fast WhatsApp chat, itinerary photos &amp; quotes.
              </span>
            </div>

            {/* Calling Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-safari-dusk flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#1E5B43]" />
                  Call Number (Voice Phone)
                </label>
                <label className="text-[11px] text-mountain-hostel/70 flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameAsWhatsapp}
                    onChange={(e) => {
                      setSameAsWhatsapp(e.target.checked);
                      if (e.target.checked) {
                        setCallNumber(whatsappNumber);
                      }
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
                className="w-full text-sm rounded-xl border border-desert-atlas/40 px-3.5 py-2.5 bg-white text-safari-dusk disabled:bg-stone-50 disabled:text-stone-500 font-medium focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
              <span className="text-[11px] text-mountain-hostel/70 mt-1 block">
                Used for direct voice consultations or emergency assistance.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#2F4858]" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="traveler@example.com"
                className="w-full text-sm rounded-xl border border-desert-atlas/40 px-3.5 py-2.5 bg-white text-safari-dusk font-medium focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
              <span className="text-[11px] text-mountain-hostel/70 mt-1 block">
                Official PDF trip proposals, booking vouchers, and receipts.
              </span>
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1.5">
                Preferred Contact Methods *
              </label>
              <div className="space-y-2">
                {[
                  { id: 'whatsapp' as const, label: 'WhatsApp (Instant Messaging)' },
                  { id: 'email' as const, label: 'Email (Detailed Proposals)' },
                  { id: 'phone' as const, label: 'Direct Phone Call' },
                ].map((method) => {
                  const checked = preferredContactMethods.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => {
                        setPreferredContactMethods((prev) =>
                          prev.includes(method.id)
                            ? prev.filter((item) => item !== method.id)
                            : [...prev, method.id]
                        );
                        if (formError === 'Please tick at least one preferred contact method.') {
                          setFormError(null);
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-colors flex items-center gap-3 min-h-[44px] cursor-pointer ${
                        checked
                          ? 'border-[#1E5B43]/50 bg-emerald-50/60 text-safari-dusk font-semibold'
                          : 'border-desert-atlas/40 bg-white text-mountain-hostel hover:border-desert-atlas'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-[#1E5B43] border-[#1E5B43] text-white'
                            : 'bg-white border-stone-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-mountain-hostel/70 mt-1.5 block">
                Tick one, two, or all three ways operators can contact you.
              </span>
            </div>
          </div>

          {/* Contact Privacy Guarantee Box */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#1E5B43] shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed font-medium">
              <span className="font-bold text-[#1E5B43]">Complete Contact Privacy:</span>
              {' '}Your WhatsApp number, call number, and email address are never displayed publicly on the open marketplace. Operators only see your general itinerary, dates, group size, and country ({countryOfOrigin.trim() || currentUser?.country || 'International'}). You decide when to connect and share your contacts with your chosen operator.
            </div>
          </div>
        </div>

        {/* Step 5: Notes */}
        <div className="space-y-3 pt-6 border-t border-desert-atlas/20">
          <label className="block text-xs font-semibold text-safari-dusk uppercase tracking-wide">
            Additional Notes for Bidders
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell operators about your travel style, dietary requirements, photography goals, or special requests..."
            className="w-full text-sm rounded-xl border border-desert-atlas/40 p-3.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent font-medium"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-desert-atlas/20">
          <button
            type="button"
            onClick={() => setActiveTab('traveler-my-requests')}
            className="px-4 py-2 text-xs font-medium text-mountain-hostel hover:text-safari-dusk rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs transition-colors"
          >
            Publish Request (Free)
          </button>
        </div>
      </form>
    </div>
  );
};
