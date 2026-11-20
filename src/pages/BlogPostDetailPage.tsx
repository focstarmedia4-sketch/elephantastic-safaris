import React from 'react';
import { useApp } from '../context/AppContext';
import { BLOG_CATEGORIES } from '../data/seedData';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const renderInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-safari-dusk">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

export const BlogPostDetailPage: React.FC = () => {
  const { tabParam: slug, getBlogPostBySlug, deleteBlogPost, setActiveTab, currentUser } = useApp();

  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-safari-dusk font-display">Guide Not Found</h2>
        <p className="text-xs text-mountain-hostel/80">
          The destination article you are looking for does not exist.
        </p>
        <button
          onClick={() => setActiveTab('blog')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl shadow-xs min-h-[44px]"
        >
          View All Destination Guides
        </button>
      </div>
    );
  }

  const categoryMeta = BLOG_CATEGORIES.find((c) => c.id === post.category);
  const ctaPrompt =
    post.cta_prompt ||
    categoryMeta?.ctaPrompt ||
    'Planning a complete holiday? Send your travel requirements and connect with local operators.';
  const ctaButtonLabel =
    post.cta_button_label || categoryMeta?.ctaButtonLabel || 'Send Your Travel Requirements';
  const ctaCategory = post.cta_category || categoryMeta?.ctaCategory || 'safari';

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this guide?')) {
      deleteBlogPost(post.id);
      setActiveTab('blog');
    }
  };

  const handlePostRequestForDestination = () => {
    setActiveTab('traveler-post', ctaCategory);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('blog', post.category)}
          className="text-xs font-bold text-mountain-hostel hover:text-safari-dusk flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {post.category}
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Guide
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-safari-dusk tracking-tight font-display leading-tight">
          {post.title}
        </h1>
      </div>

      {/* Featured Photo */}
      <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden shadow-md bg-desert-atlas-light border border-desert-atlas/30">
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Inline Action Banner */}
      <div className="p-5 rounded-2xl bg-[#EBF3EF] border border-[#1E5B43]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E5B43]">
            Take Action on Elephantastic Safaris
          </div>
          <p className="text-sm font-bold text-safari-dusk">{ctaPrompt}</p>
        </div>
        <button
          onClick={handlePostRequestForDestination}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#1E5B43] hover:bg-[#154331] rounded-xl transition-colors flex items-center gap-1.5 shrink-0 min-h-[44px] cursor-pointer"
        >
          <span>{ctaButtonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Destination Highlights */}
      {post.highlights && post.highlights.length > 0 && (
        <div className="bg-desert-atlas-light/80 rounded-2xl border border-desert-atlas/40 p-5 space-y-2 text-xs">
          <div className="font-bold text-safari-dusk uppercase tracking-wide font-display">
            Key Highlights in {post.destination}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-mountain-hostel">
            {post.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-desert-atlas-dark shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editorial Prose Content */}
      <div className="prose prose-stone max-w-none text-mountain-hostel text-sm leading-relaxed space-y-4 pt-2">
        {post.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-lg font-bold text-safari-dusk font-display pt-4">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            const items = paragraph.split('\n- ');
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-mountain-hostel">
                {items.map((it, i) => (
                  <li key={i}>{renderInlineFormatting(it.replace(/^- /, ''))}</li>
                ))}
              </ul>
            );
          }
          if (/^\d+\.\s/.test(paragraph)) {
            const items = paragraph.split(/\n(?=\d+\.\s)/);
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-mountain-hostel">
                {items.map((it, i) => (
                  <li key={i}>{renderInlineFormatting(it.replace(/^\d+\.\s*/, ''))}</li>
                ))}
              </ol>
            );
          }
          return (
            <p key={idx} className="text-xs sm:text-sm text-mountain-hostel/90 leading-relaxed">
              {renderInlineFormatting(paragraph)}
            </p>
          );
        })}
      </div>

      {/* Bottom CTA: Post a Request for this exact destination */}
      <div className="p-8 rounded-2xl bg-safari-dusk text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl mt-8 border border-safari-dusk-light/30">
        <div className="space-y-1.5 max-w-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-desert-atlas">
            Turn Your Reading Into Direct Proposals
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            {ctaPrompt}
          </h3>
          <p className="text-xs text-desert-atlas-light/85 leading-relaxed">
            Post your dates and budget for {post.destination} completely free. Verified Kenyan operators, hotels, and B&amp;B hosts will send custom quotes directly to your dashboard.
          </p>
        </div>

        <button
          onClick={handlePostRequestForDestination}
          className="px-5 py-3 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2 self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>{ctaButtonLabel}</span>
        </button>
      </div>
    </div>
  );
};
