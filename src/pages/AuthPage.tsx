import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LegalModal } from '../components/LegalModal';
import { supabase } from '../supabaseClient';
import { startGoogleOAuth } from '../utils/googleAuth';
import {
  Compass,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';

const SIGNUP_SUCCESS_MESSAGE =
  'Your account has been created. Please check your email and verify your address before logging in.';

export const AuthPage: React.FC = () => {
  const { refreshData, setActiveTab, tabParam } = useApp();

  const initialParams = new URLSearchParams(window.location.search);
  const initialSignupSuccess = initialParams.get('signup') === 'success';
  const initialPrefillEmail = initialParams.get('email') || '';

  const [authMode, setAuthMode] = useState<'register' | 'signin'>(() => {
    if (initialSignupSuccess) return 'signin';
    if (tabParam === 'traveler' || tabParam === 'operator' || tabParam === 'register') return 'register';
    if (tabParam === 'signin') return 'signin';
    return 'signin';
  });

  const [role, setRole] = useState<UserRole>(tabParam === 'operator' ? 'operator' : 'traveler');
  const [email, setEmail] = useState(initialPrefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoadingRole, setGoogleLoadingRole] = useState<UserRole | null>(null);
  const [googleFallback, setGoogleFallback] = useState<{ url: string; role: 'traveller' | 'operator' } | null>(null);
  const googleInFlightRef = React.useRef(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSignupSuccess ? SIGNUP_SUCCESS_MESSAGE : null
  );

  React.useEffect(() => {
    const resetGoogleState = () => {
      googleInFlightRef.current = false;
      setGoogleLoadingRole(null);
    };
    window.addEventListener('pageshow', resetGoogleState);
    return () => window.removeEventListener('pageshow', resetGoogleState);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'success') {
      const prefillEmail = params.get('email');
      setAuthMode('signin');
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
      setSuccessMessage(SIGNUP_SUCCESS_MESSAGE);
      return;
    }

    if (tabParam === 'operator') {
      setRole('operator');
      setAuthMode('register');
    } else if (tabParam === 'traveler') {
      setRole('traveler');
      setAuthMode('register');
    } else if (tabParam === 'signin') {
      setAuthMode('signin');
    } else if (tabParam === 'register') {
      setAuthMode('register');
    }
  }, [tabParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);
    setSuccessMessage(null);

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
        setError('Please enter your full name or company representative name.');
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
        // Rule 1: Pass role ('traveller' | 'operator', never 'admin') and full_name in options.data
        const dbRole = role === 'operator' ? 'operator' : 'traveller';
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              role: dbRole,
              full_name: name.trim(),
            },
          },
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
        setAuthMode('signin');
        setEmail(trimmedEmail);
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage(SIGNUP_SUCCESS_MESSAGE);
        setActiveTab('login', 'signin');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Sign-in mode: ONLY prompted for email and password
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

        await refreshData();
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

  const handleGoogleLogin = async (
    e: React.MouseEvent<HTMLButtonElement>,
    targetRole: UserRole = role
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (googleInFlightRef.current) return;

    const chosenRole: UserRole = targetRole === 'operator' ? 'operator' : 'traveler';
    setRole(chosenRole);
    googleInFlightRef.current = true;
    setError(null);
    setAuthError(null);
    setSuccessMessage(null);
    setGoogleFallback(null);
    setGoogleLoadingRole(chosenRole);

    const res = await startGoogleOAuth(chosenRole);
    if (res.error) {
      googleInFlightRef.current = false;
      setGoogleLoadingRole(null);
      setAuthError(res.error);
      return;
    }

    if (res.openedInNewTab && res.url) {
      googleInFlightRef.current = false;
      setGoogleLoadingRole(null);
      setGoogleFallback({
        url: res.url,
        role: res.role || (chosenRole === 'operator' ? 'operator' : 'traveller'),
      });
    }
  };



  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-desert-atlas-dark uppercase tracking-wider block">
          Elephantastic Safaris
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-safari-dusk tracking-tight font-display">
          {authMode === 'register' ? 'Create your Account' : 'Welcome Back'}
        </h1>
        <p className="text-xs sm:text-sm text-mountain-hostel/80 max-w-sm mx-auto">
          {authMode === 'register'
            ? 'First-time registration: Sign up with your email and password to start posting requests or bidding.'
            : 'Sign in with your registered email and password to access your dashboard.'}
        </p>
      </div>

      {/* Mode Switcher Tabs (Register vs Sign In) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/80 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setAuthMode('register');
            setError(null);
            setAuthError(null);
            setSuccessMessage(null);
            if (window.location.pathname !== '/signup' || window.location.search) {
              window.history.replaceState(null, '', '/signup');
            }
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
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
            setSuccessMessage(null);
            if (window.location.pathname !== '/login' || window.location.search) {
              window.history.replaceState(null, '', '/login');
            }
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
            authMode === 'signin'
              ? 'bg-white text-safari-dusk shadow-xs'
              : 'text-stone-600 hover:text-safari-dusk'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-[#1E5B43]" />
          Sign In (Existing)
        </button>
      </div>

      {/* Success notification banner above the form */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E5B43]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Authentication Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-desert-atlas/30 p-6 sm:p-8 space-y-4 shadow-xs"
      >
        {/* Error notification banner */}
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

        {/* Intent Prompt Banner */}
        {tabParam === 'traveler' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-safari-dusk flex items-start gap-2.5">
            <Compass className="w-5 h-5 text-[#1E5B43] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-[#1E5B43] block">Registration Required to Post a Request:</strong>
              Please register or sign in with your email and password first to publish your custom Kenya trip request for free and receive private bids.
            </div>
          </div>
        )}

        {tabParam === 'operator' && (
          <div className="p-3.5 rounded-xl bg-desert-atlas-light/80 border border-desert-atlas text-safari-dusk flex items-start gap-2.5">
            <Briefcase className="w-5 h-5 text-mountain-hostel shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-mountain-hostel block">Licensed Operator Sign Up Required:</strong>
              Please register or sign in with your email and password first to access open traveler listings, purchase 24-hour passes, and submit bids.
            </div>
          </div>
        )}

        {/* REGISTRATION SPECIFIC FIELDS */}
        {authMode === 'register' && (
          <>
            {/* Role Picker (Traveler vs Operator) */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1.5">
                1. Select Account Type *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('traveler')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all min-h-[44px] cursor-pointer ${
                    role === 'traveler'
                      ? 'border-highlight-accent bg-desert-atlas-light/60 text-safari-dusk ring-1 ring-highlight-accent/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-desert-atlas'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Compass className="w-4 h-4 text-highlight-accent" />
                    <span>Traveler</span>
                  </div>
                  <span className="text-[11px] text-mountain-hostel/70">
                    Post requests for free &amp; receive private bids.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('operator')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all min-h-[44px] cursor-pointer ${
                    role === 'operator'
                      ? 'border-highlight-accent bg-desert-atlas-light/60 text-safari-dusk ring-1 ring-highlight-accent/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-desert-atlas'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Briefcase className="w-4 h-4 text-mountain-hostel" />
                    <span>Operator</span>
                  </div>
                  <span className="text-[11px] text-mountain-hostel/70">
                    Licensed Kenyan safari, hotel or BnB provider.
                  </span>
                </button>
              </div>
            </div>

            {/* GOOGLE OAUTH SIGNUP (TRAVELER & OPERATOR) */}
            <div className="space-y-2.5 pt-1">
              <div
                className={`rounded-xl border p-3.5 space-y-2.5 ${
                  role === 'operator'
                    ? 'border-safari-dusk/30 bg-desert-atlas-light/40'
                    : 'border-[#1E5B43]/30 bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-safari-dusk flex items-center gap-1.5">
                    {role === 'operator' ? (
                      <Briefcase className="w-3.5 h-3.5 text-mountain-hostel" />
                    ) : (
                      <Compass className="w-3.5 h-3.5 text-[#1E5B43]" />
                    )}
                    Google Sign-Up Account Type:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                      role === 'operator'
                        ? 'bg-safari-dusk text-white'
                        : 'bg-[#1E5B43] text-white'
                    }`}
                  >
                    {role === 'operator' ? 'Operator' : 'Traveller'}
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {role === 'operator'
                    ? 'You are registering with Google as a Kenyan Operator (bid on requests & unlock traveller leads).'
                    : 'You are registering with Google as a Traveller (post Kenya trip requests & compare private bids).'}
                </p>

                <button
                  type="button"
                  onClick={(e) => handleGoogleLogin(e, role)}
                  disabled={googleLoadingRole !== null || isSubmitting}
                  className="w-full py-2.5 px-4 text-xs font-bold text-stone-800 bg-white hover:bg-stone-50 disabled:opacity-70 disabled:cursor-wait border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-xs cursor-pointer min-h-[44px]"
                >
                  {googleLoadingRole !== null ? (
                    <>
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin text-safari-dusk" />
                      Connecting to Google as {role === 'operator' ? 'Operator' : 'Traveller'}...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                        />
                        <path
                          fill="#34A853"
                          d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                        />
                      </svg>
                      Continue with Google as {role === 'operator' ? 'Operator' : 'Traveller'}
                    </>
                  )}
                </button>

                {googleFallback && (
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] text-stone-700 space-y-1.5">
                    <p>
                      Google sign-in for <strong>{googleFallback.role === 'operator' ? 'Operator' : 'Traveller'}</strong> opened in a new tab.
                    </p>
                    <a
                      href={googleFallback.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#1E5B43] underline hover:text-[#154331]"
                    >
                      Didn&apos;t open? Click here to continue to Google &rarr;
                    </a>
                  </div>
                )}
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="mx-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                  or register with email
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>
            </div>

            {/* Full Name / Representative */}
            <div>
              <label className="block text-xs font-semibold text-safari-dusk mb-1">
                2. Full Name or Representative *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'traveler' ? 'e.g. Sarah Jenkins' : 'e.g. Jackson Ole Kaelo'}
                className="w-full text-sm rounded-xl border border-stone-300 px-3.5 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
            </div>
          </>
        )}

        {/* GOOGLE OAUTH SIGN IN (EXPLICIT TRAVELLER VS OPERATOR) */}
        {authMode === 'signin' && (
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-safari-dusk">
              Continue with Google — choose your account type:
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={(e) => handleGoogleLogin(e, 'traveler')}
                disabled={googleLoadingRole !== null || isSubmitting}
                className="w-full py-2.5 px-4 text-left bg-white hover:bg-emerald-50/50 disabled:opacity-70 disabled:cursor-wait border border-[#1E5B43]/40 rounded-xl transition-colors flex items-center justify-between gap-2.5 shadow-xs cursor-pointer min-h-[52px]"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {googleLoadingRole === 'traveler' ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#1E5B43]" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-stone-900">
                      {googleLoadingRole === 'traveler'
                        ? 'Connecting to Google as Traveller...'
                        : 'Continue with Google as Traveller'}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Post trip requests &amp; compare operator bids
                    </span>
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#1E5B43] text-white text-[10px] font-bold uppercase shrink-0">
                  Traveller
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => handleGoogleLogin(e, 'operator')}
                disabled={googleLoadingRole !== null || isSubmitting}
                className="w-full py-2.5 px-4 text-left bg-white hover:bg-desert-atlas-light/40 disabled:opacity-70 disabled:cursor-wait border border-safari-dusk/40 rounded-xl transition-colors flex items-center justify-between gap-2.5 shadow-xs cursor-pointer min-h-[52px]"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {googleLoadingRole === 'operator' ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-safari-dusk" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-stone-900">
                      {googleLoadingRole === 'operator'
                        ? 'Connecting to Google as Operator...'
                        : 'Continue with Google as Operator'}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Browse open requests, bid &amp; unlock leads
                    </span>
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-safari-dusk text-white text-[10px] font-bold uppercase shrink-0">
                  Operator
                </span>
              </button>
            </div>

            {googleFallback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-stone-700 space-y-1.5">
                <p>
                  Google sign-in for <strong>{googleFallback.role === 'operator' ? 'Operator' : 'Traveller'}</strong> opened in a new tab.
                </p>
                <a
                  href={googleFallback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1E5B43] underline hover:text-[#154331]"
                >
                  Didn&apos;t open? Click here to continue to Google &rarr;
                </a>
              </div>
            )}

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-stone-200" />
              <span className="mx-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="flex-grow border-t border-stone-200" />
            </div>
          </div>
        )}

        {/* EMAIL ADDRESS (BOTH MODES) */}
        <div>
          <label className="block text-xs font-semibold text-safari-dusk mb-1">
            {authMode === 'register' ? '3. Email Address *' : 'Email Address *'}
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full text-sm rounded-xl border border-stone-300 pl-10 pr-3.5 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* PASSWORD (BOTH MODES) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-safari-dusk">
              {authMode === 'register' ? '4. Password (minimum 6 characters) *' : 'Password *'}
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm rounded-xl border border-stone-300 pl-10 pr-10 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CONFIRM PASSWORD (REGISTER ONLY) */}
        {authMode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-safari-dusk mb-1">
              5. Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm rounded-xl border border-stone-300 pl-10 pr-3.5 py-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-highlight-accent/20 focus:border-highlight-accent min-h-[44px]"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}



        {/* TERMS OF USE ACCEPTANCE (REGISTER ONLY) */}
        {authMode === 'register' && (
          <div
            className={`rounded-xl border p-3.5 transition-colors ${
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

        {/* SUBMIT BUTTON */}
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
              Sign In to Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* BOTTOM TOGGLE HELPER */}
        <div className="pt-2 text-center text-xs text-stone-600">
          {authMode === 'register' ? (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setAuthError(null);
                  setSuccessMessage(null);
                  if (window.location.pathname !== '/login' || window.location.search) {
                    window.history.replaceState(null, '', '/login');
                  }
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
                  setSuccessMessage(null);
                  if (window.location.pathname !== '/signup' || window.location.search) {
                    window.history.replaceState(null, '', '/signup');
                  }
                }}
                className="font-bold text-highlight-accent hover:underline cursor-pointer"
              >
                Register a new account here
              </button>
            </p>
          )}
        </div>
      </form>

      {authError && (
        <p className="text-xs text-red-600 text-center -mt-3" role="alert">
          {authError}
        </p>
      )}



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
