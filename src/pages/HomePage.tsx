import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BLOG_CATEGORIES } from '../data/seedData';
import { BlogCategory } from '../types';
import { ShareRequestButton } from '../components/ShareRequestButton';
import { Compass, Clock, Check, ArrowRight, Building2, Trees, Home as HomeIcon, MapPin, Unlock } from 'lucide-react';

const HERO_SLIDES = [
  {
    src: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Untitled-1.png',
    alt: 'Kenya safari wildlife and landscape showcase 1',
  },
  {
    src: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Untitled-16.png',
    alt: 'Kenya safari wildlife and landscape showcase 2',
  },
  {
    src: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Untitled-1r.png',
    alt: 'Kenya safari wildlife and landscape showcase 3',
  },
  {
    src: 'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/Untitled-2.png',
    alt: 'Kenya safari wildlife and landscape showcase 4',
  },
];

export const HomePage: React.FC = () => {
  const { currentUser, openAuthPrompt, setActiveTab, requests, getSlotInfo, blogPosts, calculateUnlockFee, getListingUnlockInfo } = useApp();
  const [selectedBlogCategory, setSelectedBlogCategory] = useState<'all' | BlogCategory>('all');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Featured 3 requests for the teaser feed
  const featuredRequests = requests.slice(0, 3);
  const displayedBlogPosts =
    selectedBlogCategory === 'all'
      ? blogPosts.slice(0, 6)
      : blogPosts.filter((post) => post.category === selectedBlogCategory);

  return (
    <div className="space-y-16">
      {/* 1-Screen Punchy Hero Section */}
      <section className="relative overflow-hidden bg-safari-dusk text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4 shadow-xl border border-safari-dusk-light/40">
        {/* Background Image Slideshow Only */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {HERO_SLIDES.map((slide, idx) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                idx === activeSlideIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-safari-dusk-dark/90 via-safari-dusk/75 to-safari-dusk/35" />
        </div>

        {/* Static Hero Text & CTAs */}
        <div className="relative z-10 max-w-4xl px-6 py-16 sm:px-12 sm:py-24 space-y-6">
          <div className="text-xs font-semibold tracking-wider text-desert-atlas uppercase">
            Elephantastic Safaris. Kenya's No.1 Travel Marketplace
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-display text-balance">
            Post your dream Kenya trip. Verified operators compete to quote.
          </h1>
          <p className="text-base sm:text-lg text-desert-atlas-light/90 max-w-2xl leading-relaxed">
            Travelers from the UK, US, Europe, Asia, and worldwide can post free, customized safari, hotel, and B&amp;B requests. Verified Kenyan operators connect directly with global travelers.
          </p>

          {/* Core Call-to-Actions (Prompt to Register or Sign Up first if not logged in) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => {
                if (!currentUser) {
                  openAuthPrompt('traveler', 'traveler-post', undefined, 'Post a Request — Free');
                } else {
                  setActiveTab('traveler-post');
                }
              }}
              className="px-6 py-3.5 text-sm font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              <Compass className="w-4 h-4" />
              Post a Request — Free
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  openAuthPrompt('operator', 'operator-dashboard', undefined, "I'm a Kenyan Operator");
                } else if (currentUser.role === 'operator') {
                  setActiveTab('operator-dashboard');
                } else {
                  setActiveTab('operator-open-requests');
                }
              }}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-mountain-hostel hover:bg-mountain-hostel-light border border-desert-atlas/40 rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer hover:border-desert-atlas hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              I'm a Kenyan Operator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Editorial Trust Highlights (Clean unboxed metadata) */}
          <div className="pt-6 border-t border-safari-dusk-light/30 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-desert-atlas">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">100% Free for Travelers</span>
            </div>
            <span aria-hidden="true">&middot;</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Max 30 Bids Per Request</span>
            </div>
          </div>
        </div>

        {/* Slideshow Indicators */}
        <div
          className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5"
          role="tablist"
          aria-label="Hero slideshow controls"
        >
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={idx === activeSlideIndex}
              aria-label={`Show hero image ${idx + 1}`}
              onClick={() => setActiveSlideIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeSlideIndex
                  ? 'w-7 bg-desert-atlas'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Category Pillars (Safaris, Hotels, BnBs live from Day 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
            Covering every dimension of Kenyan travel
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Safaris */}
          <div
            onClick={() => {
              if (!currentUser) {
                openAuthPrompt('traveler', 'traveler-post', 'safari', 'Post Safari Request');
              } else {
                setActiveTab('traveler-post', 'safari');
              }
            }}
            className="group cursor-pointer bg-white rounded-xl border border-desert-atlas/30 overflow-hidden hover:border-desert-atlas hover:shadow-lg transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden bg-desert-atlas-light">
              <img
                src="https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/istockphoto-2243700096-612x612.jpg"
                alt="Maasai Mara and Amboseli safari Land Cruiser"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-mountain-hostel font-semibold uppercase tracking-wider">
                <Trees className="w-3.5 h-3.5 text-desert-atlas-dark" />
                Safaris &amp; Guided Tours
              </div>
              <h3 className="text-lg font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors font-display">
                Maasai Mara, Amboseli &amp; Tsavo
              </h3>
              <p className="text-xs text-mountain-hostel/80 leading-relaxed">
                Custom private 4x4 Land Cruisers, silver-guide led game drives, balloon safaris, and migration tracking.
              </p>
              <div className="pt-2 text-xs font-semibold text-highlight-accent flex items-center gap-1">
                Post Safari Request &rarr;
              </div>
            </div>
          </div>

          {/* Card 2: Hotels & Lodges */}
          <div
            onClick={() => {
              if (!currentUser) {
                openAuthPrompt('traveler', 'traveler-post', 'hotel', 'Post Hotel Request');
              } else {
                setActiveTab('traveler-post', 'hotel');
              }
            }}
            className="group cursor-pointer bg-white rounded-xl border border-desert-atlas/30 overflow-hidden hover:border-desert-atlas hover:shadow-lg transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden bg-desert-atlas-light">
              <img
                src="https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/The-Safari-Collection-Sasaabs-oasis-gets-rejuvenated-with-the-rain.jpg"
                alt="Luxury safari lodge terrace overlooking watering hole"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-mountain-hostel font-semibold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-desert-atlas-dark" />
                Hotels &amp; Safari Lodges
              </div>
              <h3 className="text-lg font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors font-display">
                City Stays &amp; Wilderness Lodges
              </h3>
              <p className="text-xs text-mountain-hostel/80 leading-relaxed">
                Nairobi business hubs, tented camps in private conservancies, half-board and full-board accommodations.
              </p>
              <div className="pt-2 text-xs font-semibold text-highlight-accent flex items-center gap-1">
                Post Hotel Request &rarr;
              </div>
            </div>
          </div>

          {/* Card 3: BnBs & Cottages */}
          <div
            onClick={() => {
              if (!currentUser) {
                openAuthPrompt('traveler', 'traveler-post', 'bnb', 'Post BnB Request');
              } else {
                setActiveTab('traveler-post', 'bnb');
              }
            }}
            className="group cursor-pointer bg-white rounded-xl border border-desert-atlas/30 overflow-hidden hover:border-desert-atlas hover:shadow-lg transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden bg-desert-atlas-light">
              <img
                src="https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/alfajiri-villas=402691-300.jpg"
                alt="Coastal Swahili beach villa with swimming pool"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-mountain-hostel font-semibold uppercase tracking-wider">
                <HomeIcon className="w-3.5 h-3.5 text-desert-atlas-dark" />
                BnBs, Cottages &amp; Beach Villas
              </div>
              <h3 className="text-lg font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors font-display">
                Diani, Watamu &amp; Lake Naivasha
              </h3>
              <p className="text-xs text-mountain-hostel/80 leading-relaxed">
                Private coastal villas with private chefs, lakeside rustic cottages, Karen farmhouses, and stylish city lofts.
              </p>
              <div className="pt-2 text-xs font-semibold text-highlight-accent flex items-center gap-1">
                Post BnB Request &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Marketplace Feed Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
              Active Marketplace
            </span>
            <h2 className="text-2xl font-bold text-safari-dusk tracking-tight font-display">
              Recent traveler requests receiving bids
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('operator-open-requests')}
            className="text-xs font-semibold text-mountain-hostel hover:text-highlight-accent underline underline-offset-4 flex items-center gap-1 transition-colors"
          >
            View All Open Requests &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredRequests.map((req) => {
            const slotInfo = getSlotInfo(req.id);
            const unlockFee = calculateUnlockFee(req);
            const unlockInfo = getListingUnlockInfo(req.id);
            const isOpen = req.status === 'open' && !slotInfo.isLocked;

            const handleCardClick = () => {
              if (!currentUser) {
                setActiveTab('shared-request', req.id);
              } else if (currentUser.role === 'operator') {
                setActiveTab('operator-request-detail', req.id);
              } else if (req.traveler_id === currentUser.id) {
                setActiveTab('traveler-request-detail', req.id);
              } else {
                setActiveTab('shared-request', req.id);
              }
            };

            return (
              <div
                key={req.id}
                onClick={handleCardClick}
                className="bg-white rounded-xl border border-desert-atlas/30 p-5 hover:border-desert-atlas hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-mountain-hostel/70">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-mountain-hostel uppercase tracking-wide">
                        {req.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isOpen
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                        }`}
                        title={isOpen ? 'This request is open for bids' : 'This request is closed'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                          }`}
                        />
                        <span>{isOpen ? 'Open' : 'Closed'}</span>
                      </button>
                    </div>
                    <span className="font-mono tabular-nums text-safari-dusk/70">
                      {req.start_date}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-safari-dusk leading-snug line-clamp-2 font-display">
                    {req.title}
                  </h3>

                  <div className="text-xs text-mountain-hostel/70 flex items-center gap-2">
                    <span>From {req.traveler_country}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{req.adults} Adults {req.children > 0 ? `· ${req.children} Kids` : ''}</span>
                  </div>

                  <p className="text-xs text-mountain-hostel/80 line-clamp-2">
                    {req.notes}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-desert-atlas/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mountain-hostel/70">Bidding Slots:</span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        slotInfo.isLocked ? 'text-red-700' : 'text-safari-dusk'
                      }`}
                    >
                      {slotInfo.isLocked ? 'Locked (30/30)' : `${slotInfo.left} of ${slotInfo.total} left`}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-desert-atlas-light rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        slotInfo.isLocked ? 'bg-mountain-hostel' : 'bg-highlight-accent'
                      }`}
                      style={{ width: `${Math.min(100, (slotInfo.used / slotInfo.total) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-mountain-hostel/70">Budget:</span>
                    <span className="font-bold text-safari-dusk font-mono tabular-nums">
                      {req.currency} {req.budget.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mountain-hostel/70">Contact Unlock:</span>
                    <span className="font-bold text-[#1E5B43] font-mono tabular-nums">
                      {unlockInfo.bidsOnly
                        ? 'Bids only'
                        : unlockInfo.isFull
                        ? 'Contacts full (30/30)'
                        : `KSH ${unlockFee.feeKsh.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {!currentUser && isOpen ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuthPrompt(
                              'operator',
                              'operator-request-detail',
                              req.id,
                              'Log in to Bid on this Request'
                            );
                          }}
                          className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] bg-[#1E5B43] hover:bg-[#154331] text-white whitespace-nowrap"
                        >
                          <span>Log in to bid</span>
                        </button>
                        {!unlockInfo.bidsOnly && !unlockInfo.isFull && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAuthPrompt(
                                'operator',
                                'operator-request-detail',
                                req.id,
                                'Log in to Unlock Traveler Contact'
                              );
                            }}
                            className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] bg-desert-atlas-light/70 hover:bg-desert-atlas-light text-safari-dusk border border-desert-atlas/40 whitespace-nowrap"
                          >
                            <Unlock className="w-3.5 h-3.5 shrink-0 text-[#1E5B43]" />
                            <span>Log in to unlock</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] ${
                          isOpen
                            ? 'bg-[#1E5B43] hover:bg-[#154331] text-white'
                            : 'bg-stone-600 hover:bg-stone-700 text-white'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
                            <span>
                              {unlockInfo.bidsOnly
                                ? 'Bids Only · View Details'
                                : unlockInfo.isFull
                                ? 'Contacts Full · View Details'
                                : `Unlock Contact: KSH ${unlockFee.feeKsh.toLocaleString()} · View Details`}
                            </span>
                          </>
                        ) : (
                          <span>Closed · View Request</span>
                        )}
                      </button>
                    )}
                    <ShareRequestButton request={req} variant="button" className="min-h-[44px] shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Kenya Destination Blog & 6 Core Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
              Kenya Travel Blog &middot; 6 Core Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
              Explore Kenya by Travel Style &amp; Interest
            </h2>
            <p className="text-xs sm:text-sm text-mountain-hostel/80">
              Every guide connects travel inspiration directly to verified Kenyan safari operators, coastal resorts, and local B&amp;Bs.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {selectedBlogCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedBlogCategory('all')}
                className="text-xs font-semibold text-[#1E5B43] hover:underline cursor-pointer"
              >
                Show All 6 Categories
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('blog', selectedBlogCategory === 'all' ? undefined : selectedBlogCategory)}
              className="text-xs font-semibold text-mountain-hostel hover:text-highlight-accent underline underline-offset-4 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Open Full Blog ({blogPosts.length}) &rarr;
            </button>
          </div>
        </div>

        {/* 6 Main Blog Categories Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BLOG_CATEGORIES.map((cat, idx) => {
            const isSelected = selectedBlogCategory === cat.id;
            const count = blogPosts.filter((p) => p.category === cat.id).length;
            return (
              <div
                key={cat.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBlogCategory(isSelected ? 'all' : cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBlogCategory(isSelected ? 'all' : cat.id);
                  }
                }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1E5B43] border-[#1E5B43] text-white shadow-sm'
                    : 'bg-white border-[#E2DED3] text-safari-dusk hover:border-[#1E5B43]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider font-mono tabular-nums ${
                        isSelected ? 'text-emerald-200' : 'text-[#1E5B43]'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-emerald-100' : 'text-mountain-hostel/70'
                      }`}
                    >
                      {count} {count === 1 ? 'Article' : 'Articles'}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold font-display ${isSelected ? 'text-white' : 'text-safari-dusk'}`}>
                    {cat.id}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-emerald-50/90' : 'text-mountain-hostel/80'}`}>
                    {cat.description}
                  </p>
                </div>

                <div className={`pt-2.5 border-t ${isSelected ? 'border-white/20' : 'border-[#E2DED3]'}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('traveler-post', cat.ctaCategory);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
                      isSelected
                        ? 'bg-highlight-accent hover:bg-highlight-accent-hover text-white'
                        : 'bg-[#1E5B43] hover:bg-[#154331] text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.ctaButtonLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Blog Cards with Built-In Platform Action Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {displayedBlogPosts.map((post) => {
            const categoryMeta = BLOG_CATEGORIES.find((c) => c.id === post.category) || BLOG_CATEGORIES[0];
            const ctaPrompt = post.cta_prompt || categoryMeta.ctaPrompt;
            const ctaButtonLabel = post.cta_button_label || categoryMeta.ctaButtonLabel;
            const ctaCategory = post.cta_category || categoryMeta.ctaCategory;

            return (
              <article
                key={post.id}
                onClick={() => setActiveTab('blog-detail', post.slug)}
                className="group cursor-pointer bg-white rounded-2xl border border-[#E2DED3] overflow-hidden hover:border-[#1E5B43]/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] overflow-hidden bg-desert-atlas-light relative">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-safari-dusk/90 backdrop-blur-xs text-desert-atlas text-[11px] font-semibold px-2.5 py-1 rounded-md border border-desert-atlas/20">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-mountain-hostel/70">
                      <span className="font-semibold text-desert-atlas-dark flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-highlight-accent" />
                        {post.destination}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{post.read_time}</span>
                    </div>

                    <h3 className="text-base font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors leading-snug line-clamp-2 font-display">
                      {post.title}
                    </h3>

                    <p className="text-xs text-mountain-hostel/80 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="pt-3 border-t border-desert-atlas/20 flex items-center justify-between text-xs text-mountain-hostel/70">
                    <span className="truncate">By {post.author_name}</span>
                    <span className="font-bold text-highlight-accent flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Guide &rarr;
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('traveler-post', ctaCategory);
                    }}
                    title={ctaPrompt}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1E5B43] hover:bg-[#154331] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>{ctaButtonLabel}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Why This Model: Comparison & Fairness */}
      <section className="bg-desert-atlas-light/60 border-y border-desert-atlas/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-desert-atlas/30 bg-white space-y-4 shadow-xs">
              <h3 className="font-bold text-safari-dusk text-base font-display">For Travelers</h3>
              <ul className="space-y-3 text-sm text-mountain-hostel">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>100% Free:</strong> Post requests and receive up to 30 custom quotes at zero cost.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>Competitive Bids:</strong> Operators can review your budget and submit lower quotes with their direct contacts attached.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>Direct Outreach:</strong> View operator contact details and choose to reach out via WhatsApp, phone, or email.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl border border-desert-atlas/30 bg-white space-y-4 shadow-xs">
              <h3 className="font-bold text-safari-dusk text-base font-display">For Kenyan Operators</h3>
              <ul className="space-y-3 text-sm text-mountain-hostel">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>Two Reach Methods:</strong> KSH 850 for a 24-hour bidding pass across all open requests, or unlock individual traveler contacts tiered by budget (KSH 120 – 5,000, max 30 unlocks).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>0% Commission:</strong> You keep every single shilling of the safari or accommodation booking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-desert-atlas-dark shrink-0 mt-0.5" />
                  <span><strong>Direct Access:</strong> Fast registration with direct access to traveler inquiries without paperwork hurdles.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
