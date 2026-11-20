import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BlogPost, BlogCategory, TravelCategory } from '../types';
import { IMAGES } from '../assets/images';
import { BLOG_CATEGORIES } from '../data/seedData';
import {
  Compass,
  BookOpen,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Trees,
  Palmtree,
  Building2,
  Utensils,
  Mountain,
  Map,
  CheckCircle2,
  X,
} from 'lucide-react';

const CATEGORY_ICONS: Record<BlogCategory, React.FC<{ className?: string }>> = {
  'Safaris & Wildlife': Trees,
  'Beaches & Coastal Holidays': Palmtree,
  'Hotels & Accommodation': Building2,
  'Food & Culture': Utensils,
  'Adventures & Experiences': Mountain,
  'Travel Guides & Inspiration': Map,
};

export const BlogPage: React.FC = () => {
  const { blogPosts, createBlogPost, setActiveTab, tabParam, currentUser } = useApp();

  const initialCategoryFromParam =
    tabParam && BLOG_CATEGORIES.some((c) => c.id === tabParam)
      ? (tabParam as BlogCategory)
      : null;

  const [openedCategory, setOpenedCategory] = useState<BlogCategory | null>(initialCategoryFromParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFromParam || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  useEffect(() => {
    if (tabParam && BLOG_CATEGORIES.some((c) => c.id === tabParam)) {
      const cat = tabParam as BlogCategory;
      setOpenedCategory(cat);
      setSelectedCategory(cat);
    } else if (!tabParam) {
      setOpenedCategory(null);
      setSelectedCategory('All');
    }
  }, [tabParam]);

  const handleOpenCategoryPage = (category: BlogCategory) => {
    setOpenedCategory(category);
    setSelectedCategory(category);
    setActiveTab('blog', category);
  };

  const handleBackToAllCategories = () => {
    setOpenedCategory(null);
    setSelectedCategory('All');
    setActiveTab('blog');
  };

  // New post form state
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('Amboseli & Chyulu Hills');
  const [newCategory, setNewCategory] = useState<BlogCategory>('Safaris & Wildlife');
  const [newImagePreset, setNewImagePreset] = useState<string>(IMAGES.blogMara);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [newReadTime, setNewReadTime] = useState('5 min read');
  const [newBestMonths, setNewBestMonths] = useState('June to October, January to February');
  const [newEstimatedBudget, setNewEstimatedBudget] = useState('$350 - $750 / day');
  const [newRecommendedDuration, setNewRecommendedDuration] = useState('3 to 5 days');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newHighlights, setNewHighlights] = useState(
    'Big tusker elephants, Panoramic Mount Kilimanjaro views, Observation Hill walks'
  );
  const [newCtaPrompt, setNewCtaPrompt] = useState('Looking for a safari? Submit a free safari request.');
  const [newCtaCategory, setNewCtaCategory] = useState<TravelCategory>('safari');

  const handleCategoryChangeInModal = (cat: BlogCategory) => {
    setNewCategory(cat);
    const meta = BLOG_CATEGORIES.find((c) => c.id === cat);
    if (meta) {
      setNewCtaPrompt(meta.ctaPrompt);
      setNewCtaCategory(meta.ctaCategory);
    }
  };

  const activeCategoryMeta = BLOG_CATEGORIES.find((c) => c.id === selectedCategory);

  const filteredPosts = blogPosts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.destination.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const highlightsArr = newHighlights
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const imageUrl = customImageUrl.trim() || newImagePreset;
    const catMeta = BLOG_CATEGORIES.find((c) => c.id === newCategory);

    const slug = createBlogPost({
      title: newTitle.trim(),
      destination: newDestination.trim(),
      category: newCategory,
      image_url: imageUrl,
      author_name: currentUser?.name || 'Elephantastic Safaris Editorial',
      author_role: currentUser?.role === 'operator' ? 'Verified Kenyan Operator' : 'Kenya Travel Editor',
      read_time: newReadTime.trim() || '4 min read',
      excerpt: newExcerpt.trim() || newContent.trim().substring(0, 160) + '...',
      content: newContent.trim(),
      best_months: newBestMonths.trim(),
      estimated_budget_usd: newEstimatedBudget.trim(),
      recommended_duration: newRecommendedDuration.trim(),
      highlights: highlightsArr.length > 0 ? highlightsArr : ['Authentic Kenyan hospitality', 'Custom private guiding'],
      cta_prompt: newCtaPrompt.trim() || catMeta?.ctaPrompt,
      cta_button_label: catMeta?.ctaButtonLabel || 'Submit a Free Request',
      cta_category: newCtaCategory,
    });

    setIsWriteModalOpen(false);
    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setActiveTab('blog-detail', slug);
  };

  if (openedCategory) {
    const categoryIndex = BLOG_CATEGORIES.findIndex((c) => c.id === openedCategory);
    const categoryMeta = BLOG_CATEGORIES[categoryIndex] || BLOG_CATEGORIES[0];
    const CategoryIcon = CATEGORY_ICONS[openedCategory];
    const categoryPosts = blogPosts.filter((p) => p.category === openedCategory);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Top Back Navigation & Category Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToAllCategories}
            className="text-xs font-bold text-[#1E5B43] hover:text-safari-dusk flex items-center gap-1.5 transition-colors cursor-pointer self-start min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All 6 Best Places Categories</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {BLOG_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleOpenCategoryPage(cat.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors min-h-[38px] cursor-pointer ${
                  cat.id === openedCategory
                    ? 'bg-[#1E5B43] text-white'
                    : 'bg-white border border-[#E2DED3] text-mountain-hostel hover:border-[#1E5B43]/50'
                }`}
              >
                0{idx + 1}. {cat.id}
              </button>
            ))}
          </div>
        </div>

        {/* Full-Page Category Header */}
        <div className="bg-white rounded-2xl border border-[#E2DED3] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5B43]">
              <CategoryIcon className="w-4 h-4 shrink-0" />
              <span>Category 0{categoryIndex + 1}</span>
              <span aria-hidden="true">&middot;</span>
              <span>
                {categoryPosts.length} {categoryPosts.length === 1 ? 'Article' : 'Articles'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-safari-dusk tracking-tight font-display">
              {openedCategory}
            </h1>
            <p className="text-sm text-mountain-hostel/85 leading-relaxed">
              {categoryMeta.description} Select any article below to open and read it in full, or post a free request directly to verified Kenyan operators.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('traveler-post', categoryMeta.ctaCategory)}
            className="px-5 py-3 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 min-h-[44px] cursor-pointer self-start md:self-auto"
          >
            <Compass className="w-4 h-4" />
            <span>{categoryMeta.ctaButtonLabel}</span>
          </button>
        </div>

        {/* Separate Articles Inside This Category (Click any article to open & read separately) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {categoryPosts.map((post, idx) => {
            const actionCategory = post.cta_category || categoryMeta.ctaCategory;
            const actionLabel = post.cta_button_label || categoryMeta.ctaButtonLabel;

            return (
              <article
                key={post.id}
                onClick={() => setActiveTab('blog-detail', post.slug)}
                className="group cursor-pointer bg-white rounded-2xl border border-[#E2DED3] overflow-hidden hover:border-[#1E5B43]/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-desert-atlas-light relative">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-safari-dusk/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      Article {idx + 1} of {categoryPosts.length}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-mountain-hostel/75">
                      <span className="font-bold text-desert-atlas-dark flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-highlight-accent" />
                        {post.destination}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{post.read_time}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>By {post.author_name}</span>
                    </div>

                    <h2 className="text-xl font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors leading-snug font-display">
                      {post.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-mountain-hostel/85 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {post.highlights && post.highlights.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {post.highlights.slice(0, 3).map((h, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2 text-xs text-mountain-hostel">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E5B43] shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Article Card Footer: Open & Read Separately + Post a Request Button */}
                <div className="px-6 pb-6 pt-0 space-y-3">
                  <div className="pt-4 border-t border-[#E2DED3] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('blog-detail', post.slug);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-[#E2DED3] hover:border-[#1E5B43] text-xs font-bold text-safari-dusk hover:text-[#1E5B43] transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open &amp; Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('traveler-post', actionCategory);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#1E5B43] hover:bg-[#154331] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer flex-1"
                    >
                      <Compass className="w-3.5 h-3.5 shrink-0" />
                      <span>{actionLabel}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Category Page Bottom CTA ending with Traveler Request Button */}
        <div className="bg-safari-dusk text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-safari-dusk-light/30">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold text-desert-atlas uppercase tracking-wider block">
              {openedCategory} &middot; Direct Kenyan Operator Quotes
            </span>
            <h2 className="text-2xl font-bold text-white font-display">
              {categoryMeta.ctaPrompt}
            </h2>
            <p className="text-xs text-desert-atlas-light/85 leading-relaxed">
              Submit your dates, travelers, and budget once for free. Verified Kenyan operators compete to send tailored itineraries and direct contact details with 0% commission.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('traveler-post', categoryMeta.ctaCategory)}
            className="px-6 py-3.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 self-start md:self-auto min-h-[44px] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{categoryMeta.ctaButtonLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-desert-atlas/30 pb-8">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-desert-atlas-dark uppercase tracking-wider block">
            Best Places to Visit in Kenya &middot; Travel Guides &amp; Blog
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-safari-dusk tracking-tight font-display">
            Discover Kenya: Best Places, Experiences &amp; Stays
          </h1>
          <p className="text-sm text-mountain-hostel/80 leading-relaxed">
            Explore white-sand Indian Ocean beaches, iconic Maasai Mara safaris, Kenyan cuisine, hidden gems, and handpicked lodges across 6 core categories—with direct connections to verified Kenyan operators.
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-desert-atlas-light/80 border border-desert-atlas/30 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-mountain-hostel text-white shadow-xs'
                : 'text-mountain-hostel hover:text-safari-dusk'
            }`}
          >
            All ({blogPosts.length})
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-mountain-hostel text-white shadow-xs'
                  : 'text-mountain-hostel hover:text-safari-dusk'
              }`}
            >
              {cat.id}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-desert-atlas-dark absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parks, coast, food, stays..."
            className="w-full text-xs rounded-xl border border-desert-atlas/40 pl-9 pr-3 py-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
          />
        </div>
      </div>

      {/* Category Conversion Strip when a specific category is selected */}
      {activeCategoryMeta && (
        <div className="p-5 rounded-2xl bg-[#EBF3EF] border border-[#1E5B43]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1E5B43]">
              {activeCategoryMeta.id}
            </div>
            <p className="text-sm font-bold text-safari-dusk">
              {activeCategoryMeta.ctaPrompt}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('traveler-post', activeCategoryMeta.ctaCategory)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors flex items-center gap-2 shrink-0 min-h-[44px] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{activeCategoryMeta.ctaButtonLabel}</span>
          </button>
        </div>
      )}

      {/* Blog Cards Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2DED3] p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-desert-atlas mx-auto" />
          <h3 className="text-base font-bold text-safari-dusk font-display">No destination guides found</h3>
          <p className="text-xs text-mountain-hostel/80 max-w-md mx-auto">
            Try searching for another keyword or publish the first guide for this category.
          </p>
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs min-h-[44px] cursor-pointer"
          >
            Create New Guide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {filteredPosts.map((post) => {
            const catMeta = BLOG_CATEGORIES.find((c) => c.id === post.category);
            const actionPrompt =
              post.cta_prompt || catMeta?.ctaPrompt || 'Planning a trip? Submit a free request.';
            const actionCategory = post.cta_category || catMeta?.ctaCategory || 'safari';

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
                    <div className="absolute top-3 left-3 bg-safari-dusk/95 backdrop-blur-xs text-desert-atlas text-[11px] font-bold px-2.5 py-1 rounded-lg border border-desert-atlas/20">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-mountain-hostel/70">
                      <span className="font-bold text-desert-atlas-dark flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-highlight-accent" />
                        {post.destination}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{post.read_time}</span>
                    </div>

                    <h2 className="text-base font-bold text-safari-dusk group-hover:text-highlight-accent transition-colors leading-snug line-clamp-2 font-display">
                      {post.title}
                    </h2>

                    <p className="text-xs text-mountain-hostel/80 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Read Guide Footer + Ends with Post a Request Button */}
                <div className="px-6 pb-6 pt-0 space-y-3">
                  <div className="pt-3 border-t border-[#E2DED3] flex items-center justify-between text-xs text-mountain-hostel/70">
                    <div className="truncate">
                      By <span className="font-bold text-safari-dusk">{post.author_name}</span>
                    </div>
                    <span className="font-bold text-highlight-accent flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Full Article &rarr;
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('traveler-post', actionCategory);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1E5B43] hover:bg-[#154331] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>{post.cta_button_label || catMeta?.ctaButtonLabel || 'Post a Free Request'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom Call to Action: Turn Inspiration into Quotes */}
      <div className="bg-safari-dusk text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-safari-dusk-light/30">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold text-desert-atlas uppercase tracking-wider block">
            Turn Inspiration Into Real Bookings
          </span>
          <h2 className="text-2xl font-bold text-white font-display">
            Planning a complete holiday? Send your travel requirements and connect with local operators.
          </h2>
          <p className="text-xs text-desert-atlas-light/85 leading-relaxed">
            Post your dates, group size, and budget once for free. Verified Kenyan safari operators, coastal resorts, and B&amp;B hosts compete with itemized proposals and direct contacts—0% booking commission.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('traveler-post', activeCategoryMeta?.ctaCategory || 'safari')}
          className="px-6 py-3.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 self-start md:self-auto min-h-[44px] cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>{activeCategoryMeta?.ctaButtonLabel || 'Post Free Request Now'}</span>
        </button>
      </div>

      {/* Write Blog Post Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk-dark/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-desert-atlas/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-desert-atlas/30 bg-desert-atlas-light">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-highlight-accent" />
                <h2 className="text-base font-bold text-safari-dusk font-display">
                  Publish a Kenya Travel Guide
                </h2>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 text-mountain-hostel/60 hover:text-safari-dusk rounded-lg hover:bg-desert-atlas/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-safari-dusk mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lake Naivasha & Hell's Gate: Cycling with Zebras & Geothermal Spas"
                  className="w-full text-sm font-bold rounded-lg border border-desert-atlas/40 px-3.5 py-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Destination / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="e.g. Samburu National Reserve"
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Blog Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => handleCategoryChangeInModal(e.target.value as BlogCategory)}
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                  >
                    {BLOG_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Image Selector */}
              <div>
                <label className="block text-xs font-bold text-safari-dusk mb-1.5">
                  Select Featured Photo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: IMAGES.blogMara, label: 'Migration' },
                    { id: IMAGES.safariTours, label: 'Safaris' },
                    { id: IMAGES.blogDiani, label: 'Beaches' },
                    { id: IMAGES.blogBushCamp, label: 'Bush Camps' },
                    { id: IMAGES.blogRomanticKenya, label: 'Honeymoon' },
                    { id: IMAGES.blogNyamaChoma, label: 'Cuisine' },
                    { id: IMAGES.blogKenyanCulture, label: 'Culture' },
                    { id: IMAGES.blogMountKenya, label: 'Adventure' },
                    { id: IMAGES.blogRiftValley, label: 'Landscapes' },
                    { id: IMAGES.blogHiddenGems, label: 'Hidden Gems' },
                  ].map((img) => (
                    <button
                      type="button"
                      key={img.label}
                      onClick={() => {
                        setNewImagePreset(img.id);
                        setCustomImageUrl('');
                      }}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        newImagePreset === img.id && !customImageUrl
                          ? 'border-highlight-accent ring-2 ring-highlight-accent/30'
                          : 'border-desert-atlas/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={img.id} alt={img.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-1 left-1 bg-safari-dusk/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reader Call-To-Action Prompt */}
              <div className="p-3.5 rounded-xl bg-[#F6F4EE] border border-[#E2DED3] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Reader Action Prompt (Shown in article)
                  </label>
                  <input
                    type="text"
                    value={newCtaPrompt}
                    onChange={(e) => setNewCtaPrompt(e.target.value)}
                    placeholder="e.g. Looking for a safari? Submit a free safari request."
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Action Destination Form
                  </label>
                  <select
                    value={newCtaCategory}
                    onChange={(e) => setNewCtaCategory(e.target.value as TravelCategory)}
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk"
                  >
                    <option value="safari">Safari Request</option>
                    <option value="hotel">Hotel Request</option>
                    <option value="bnb">Coastal / BnB Request</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Best Time to Visit
                  </label>
                  <input
                    type="text"
                    value={newBestMonths}
                    onChange={(e) => setNewBestMonths(e.target.value)}
                    placeholder="e.g. July to October"
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Budget Estimate (USD)
                  </label>
                  <input
                    type="text"
                    value={newEstimatedBudget}
                    onChange={(e) => setNewEstimatedBudget(e.target.value)}
                    placeholder="e.g. $400 - $800 / day"
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-dusk mb-1">
                    Recommended Duration
                  </label>
                  <input
                    type="text"
                    value={newRecommendedDuration}
                    onChange={(e) => setNewRecommendedDuration(e.target.value)}
                    placeholder="e.g. 3 to 5 days"
                    className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-safari-dusk mb-1">
                  Key Highlights (comma-separated)
                </label>
                <input
                  type="text"
                  value={newHighlights}
                  onChange={(e) => setNewHighlights(e.target.value)}
                  placeholder="e.g. Game drives, Lake boat tour, Crescent Island walking safari"
                  className="w-full text-xs rounded-lg border border-desert-atlas/40 px-3 py-2 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-safari-dusk mb-1">
                  Short Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="One or two sentences explaining why travelers must visit..."
                  className="w-full text-xs rounded-lg border border-desert-atlas/40 p-2.5 bg-white text-safari-dusk focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-safari-dusk mb-1">
                  Full Guide Article Content
                </label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share detailed advice: wildlife highlights, recommended lodges, logistics from Nairobi, and natural call-to-action..."
                  className="w-full text-xs rounded-lg border border-desert-atlas/40 p-3 bg-white text-safari-dusk font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-desert-atlas/30">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-mountain-hostel hover:text-safari-dusk transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-sm transition-colors"
                >
                  Publish Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
