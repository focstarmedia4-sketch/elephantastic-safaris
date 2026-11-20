import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LegalModal } from './LegalModal';
import { supabase } from '../supabaseClient';
import {
  Compass,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ArrowRight,
  Shield,
  Check,
} from 'lucide-react';

export const AuthPromptModal: React.FC = () => {
  const {
    authPrompt,
    closeAuthPrompt,
    loginUser,
    setActiveTab,
  } = useApp();

  const [authMode, setAuthMode] = useState<'register' | 'signin'>('register');
  const [role, setRole] = useState<UserRole>(authPrompt?.role || 'traveler');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync role if prompt changes
  React.useEffect(() => {
    if (authPrompt?.role) {
      setRole(authPrompt.role);
    }
    setError(null);
    setAuthError(null);
    setSuccessMsg(null);
  }, [authPrompt?.role]);

  if (!authPrompt?.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name or representative name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
      if (!acceptedTerms) {
        setError('Please accept the Terms of Use to create an account.');
        return;
      }

      setIsSubmitting(true);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (signUpError) {
          setAuthError(signUpError.message);
          return;
        }

        // Do not auto-login after signup; redirect to Sign In with pre-filled email
        if (data.session) {
          await supabase.auth.signOut();
        }

        const loginUrl = `/login?signup=success&email=${encodeURIComponent(trimmedEmail)}`;
        window.history.pushState(null, '', loginUrl);
        setPassword('');
        setConfirmPassword('');
        closeAuthPrompt();
        setActiveTab('login', 'signin');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Sign-in mode
      setIsSubmitting(true);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setAuthError(signInError.message);
          return;
        }

        if (!data.session) {
          setAuthError('Check your email and confirm your account before logging in.');
          return;
        }

        localStorage.setItem('elephantastic_has_registered', 'true');
        const derivedName =
          (data.user?.user_metadata?.name as string | undefined) ||
          trimmedEmail.split('@')[0] ||
          'Traveler';
        loginUser(trimmedEmail, role, derivedName, 'United Kingdom', password);
        closeAuthPrompt();
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
        setActiveTab('home');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isOperatorTarget = (authPrompt?.role === 'operator') || role === 'operator';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-safari-dusk/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-desert-atlas/30 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-safari-dusk text-white p-5 flex items-start justify-between relative shrink-0">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-desert-atlas bg-white/10 px-2 py-0.5 rounded-full">
                {isOperatorTarget ? 'Operator Sign Up' : 'Traveler Sign Up'}
              </span>
            </div>
            <h2 className="text-lg font-bold font-display text-white tracking-tight">
              {isOperatorTarget
                ? 'Register or Sign In as an Operator'
                : 'Register or Sign In to Post a Request'}
            </h2>
            <p className="text-xs text-desert-atlas-light/90 leading-relaxed">
              {isOperatorTarget
                ? 'Please register or sign in with your email and password first to access open traveler listings, bid directly (KSH 850 24h pass), or unlock traveler contacts (tiered KSH 120 – 5,000).'
                : 'Please register or sign in with your email and password first to post your custom Kenya trip request for free.'}
            </p>
          </div>
          <button
            onClick={closeAuthPrompt}
            className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                setAuthError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-safari-dusk shadow-xs'
                  : 'text-stone-600 hover:text-safari-dusk'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-highlight-accent" />
              Register (New Account)
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                setAuthError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-safari-dusk shadow-xs'
                  : 'text-stone-600 hover:text-safari-dusk'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#1E5B43]" />
              Sign In (Existing)
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {authMode === 'signin' && error.includes('No registered account') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError(null);
                    }}
                    className="block mt-1 font-bold underline text-red-800"
                  >
                    Click here to register with this email
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E5B43]" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* If Register: Role Switcher */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-safari-dusk mb-1">
                  Account Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('traveler')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                      role === 'traveler'
                        ? 'border-highlight-accent bg-desert-atlas-light/60 text-safari-dusk font-bold ring-1 ring-highlight-accent/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-desert-atlas'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-highlight-accent shrink-0" />
                    <span className="text-xs">Traveler</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('operator')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                      role === 'operator'
                        ? 'border-highlight-accent bg-desert-atlas-light/60 text-safari-dusk font-bold ring-1 ring-highlight-accent/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-desert-atlas'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-mountain-hostel shrink-0" />
                    <span className="text-xs">Kenyan Operator</span>
                  </button>
                </div>
              </div>
            )}

            {/* Name (Register Only) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-safari-dusk mb-1">
                  Full Name / Company Representative *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'traveler' ? 'e.g. Sarah Jenkins' : 'e.g. Jackson Ole Kaelo'}
                  className="w-full text-sm rounded-xl border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
                />
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full text-sm rounded-xl border border-stone-300 pl-9 pr-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-safari-dusk">
                  Password *
                </label>
                {authMode === 'signin' && (
                  <span className="text-[10px] text-stone-500">
                    Demo: <code className="bg-stone-100 px-1 py-0.5 rounded">safari123</code>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm rounded-xl border border-stone-300 pl-9 pr-9 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register Only) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-safari-dusk mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm rounded-xl border border-stone-300 pl-9 pr-3 py-2 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Terms of Use Acceptance (Register Only) */}
            {authMode === 'register' && (
              <div
                className={`rounded-xl border p-3 transition-colors ${
                  acceptedTerms
                    ? 'border-[#1E5B43]/40 bg-emerald-50/50'
                    : 'border-desert-atlas/40 bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={acceptedTerms}
                    aria-label="Accept Terms of Use"
                    onClick={() => {
                      setAcceptedTerms((prev) => !prev);
                      if (error === 'Please accept the Terms of Use to create an account.') {
                        setError(null);
                      }
                    }}
                    className="min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        acceptedTerms
                          ? 'bg-[#1E5B43] border-[#1E5B43] text-white'
                          : 'bg-white border-stone-400 text-transparent hover:border-safari-dusk'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </button>
                  <div className="text-xs text-mountain-hostel leading-relaxed pt-0.5">
                    <span>I accept the </span>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-bold text-[#1E5B43] underline underline-offset-2 hover:text-[#154331] cursor-pointer"
                    >
                      Terms of Use
                    </button>
                    <span> of Elephantastic Safaris.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-highlight-accent hover:bg-highlight-accent-hover rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px] mt-2"
            >
              {authMode === 'register' ? (
                <>
                  Register &amp; Continue as {role === 'traveler' ? 'Traveler' : 'Operator'}
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Sign In &amp; Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {authError && (
            <p className="text-xs text-red-600 text-center" role="alert">
              {authError}
            </p>
          )}

          {/* Mode toggle link */}
          <div className="pt-1 text-center text-xs text-stone-600">
            {authMode === 'register' ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                    setAuthError(null);
                  }}
                  className="font-bold text-highlight-accent hover:underline cursor-pointer"
                >
                  Sign in with email and password
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                    setAuthError(null);
                  }}
                  className="font-bold text-highlight-accent hover:underline cursor-pointer"
                >
                  Register a new account here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab="terms"
        onAccept={() => {
          setAcceptedTerms(true);
          if (error === 'Please accept the Terms of Use to create an account.') {
            setError(null);
          }
        }}
      />
    </div>
  );
};
