import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

export interface GoogleOAuthResult {
  error?: string;
}

/**
 * Initiates Supabase Google OAuth immediately on first click.
 * Uses skipBrowserRedirect so we can validate the generated URL,
 * handle embedded iframe top-navigation safely, and surface any errors immediately.
 */
export async function startGoogleOAuth(targetRole: UserRole): Promise<GoogleOAuthResult> {
  try {
    try {
      localStorage.setItem('elephantastic_oauth_role', targetRole);
    } catch {
      // Ignore storage errors in restricted/private browsing contexts
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.url) {
      return { error: 'Could not start Google sign-in. Please try again.' };
    }

    let authUrl = data.url;
    try {
      const parsed = new URL(data.url);
      parsed.searchParams.delete('skip_http_redirect');
      authUrl = parsed.toString();
    } catch {
      // Fall back to raw URL if parsing fails
    }

    // Break out of iframes when allowed (Google blocks framing accounts.google.com),
    // otherwise navigate the current window directly.
    if (window.self !== window.top) {
      try {
        window.top!.location.href = authUrl;
        return {};
      } catch {
        // Cross-origin frame without top navigation permission — fall back to current frame
      }
    }

    window.location.assign(authUrl);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Google sign-in failed. Please try again.',
    };
  }
}
