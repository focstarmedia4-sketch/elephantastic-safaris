import { createClient } from "@supabase/supabase-js";

// Paste your Supabase Project URL here (base project URL, without /rest/v1/)
const SUPABASE_URL = "https://zzsxyuojnkxfedjecfha.supabase.co";

// Paste your Supabase Public (Publishable) Key here
const SUPABASE_PUBLIC_KEY = "sb_publishable_784QIJaTvDeGmE4Kad8wiQ_QDel-TOL";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    flowType: "implicit",
  },
});
