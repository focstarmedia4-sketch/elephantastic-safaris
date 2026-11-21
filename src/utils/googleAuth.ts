import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

export type OAuthSignupRole = 'traveller' | 'operator';

export interface GoogleOAuthResult {
  error?: string;
  url?: string;
  openedInNewTab?: boolean;
  role?: OAuthSignupRole;
}

const OAUTH_ROLE_COOKIE = 'es_oauth_role';

export function normalizeOAuthRole(role: string | null | undefined): OAuthSignupRole | null {
  if (!role) return null;
  const cleaned = role.trim().toLowerCase();
  if (cleaned === 'operator') return 'operator';
  if (cleaned === 'traveller' || cleaned === 'traveler') return 'traveller';
  return null;
}

function setTransientOAuthRoleCookie(role: OAuthSignupRole): void {
  try {
    const isHttps = window.location.protocol === 'https:';
    const isEmbedded = window.self !== window.top;
    const sameSite = isEmbedded && isHttps ? 'SameSite=None; Secure' : isHttps ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
    document.cookie = `${OAUTH_ROLE_COOKIE}=${encodeURIComponent(role)}; Max-Age=300; Path=/; ${sameSite}`;
  } catch {
    // Ignore if cookies are blocked
  }
}

function getTransientOAuthRoleCookie(): OAuthSignupRole | null {
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const part of cookies) {
      const [rawKey, ...rawVal] = part.trim().split('=');
      if (rawKey === OAUTH_ROLE_COOKIE) {
        return normalizeOAuthRole(decodeURIComponent(rawVal.join('=')));
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

export function clearOAuthRoleIntent(): void {
  try {
    const isHttps = window.location.protocol === 'https:';
    const isEmbedded = window.self !== window.top;
    const sameSite = isEmbedded && isHttps ? 'SameSite=None; Secure' : isHttps ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
    document.cookie = `${OAUTH_ROLE_COOKIE}=; Max-Age=0; Path=/; ${sameSite}`;
  } catch {
    // Ignore
  }

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('oauth_role')) {
      url.searchParams.delete('oauth_role');
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', nextUrl || '/');
    }
  } catch {
    // Ignore
  }
}

/**
 * Reads the intended signup/login role ('traveller' | 'operator') passed through
 * the Google OAuth redirect URL (with transient cookie fallback if Supabase strips query params).
 * Never returns 'admin'.
 */
export function readOAuthRoleIntent(): OAuthSignupRole | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeOAuthRole(params.get('oauth_role'));
    if (fromQuery) return fromQuery;
  } catch {
    // Ignore
  }

  return getTransientOAuthRoleCookie();
}

/**
 * Checks whether Supabase/Google redirected back with an OAuth error in the URL query or hash.
 */
export function readOAuthErrorFromUrl(): string | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const errDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (errDesc) {
      return decodeURIComponent(errDesc.replace(/\+/g, ' '));
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Initiates Supabase Google OAuth for a clearly chosen role ('traveller' | 'operator').
 * - Passes `?oauth_role=traveller|operator` in redirectTo (no localStorage/sessionStorage).
 * - In a normal top-level browser tab, navigates directly to Google OAuth.
 * - Inside a cross-origin embedded iframe (where Google blocks framing and top navigation is blocked),
 *   opens Google OAuth cleanly in a new tab and returns the URL so the UI can also render a direct link.
 */
export async function startGoogleOAuth(targetRole: UserRole | OAuthSignupRole): Promise<GoogleOAuthResult> {
  const dbRole: OAuthSignupRole = targetRole === 'operator' ? 'operator' : 'traveller';

  try {
    // Set transient 5-minute cookie as backup in case Supabase Redirect URL settings strip query params
    setTransientOAuthRoleCookie(dbRole);

    const redirectUrl = new URL(window.location.origin);
    redirectUrl.searchParams.set('oauth_role', dbRole);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl.toString(),
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { error: `Google OAuth failed: ${error.message}` };
    }

    if (!data?.url) {
      return { error: 'Supabase did not return a Google OAuth URL. Check Google provider settings in Supabase Auth.' };
    }

    let authUrl = data.url;
    try {
      const parsed = new URL(data.url);
      parsed.searchParams.delete('skip_http_redirect');
      authUrl = parsed.toString();
    } catch {
      // Keep raw URL if parsing fails
    }

    const isEmbeddedIframe = window.self !== window.top;

    if (isEmbeddedIframe) {
      // Google blocks rendering accounts.google.com inside iframes (X-Frame-Options: DENY),
      // and cross-origin iframes block window.top.location navigation.
      // Open the Supabase/Google authorization URL in a new browser tab instead.
      const link = document.createElement('a');
      link.href = authUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        url: authUrl,
        openedInNewTab: true,
        role: dbRole,
      };
    }

    window.location.assign(authUrl);
    return {
      url: authUrl,
      openedInNewTab: false,
      role: dbRole,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Google sign-in failed. Please try again.',
    };
  }
}
