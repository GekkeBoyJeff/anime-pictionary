/*
 * Supabase client singleton.
 *
 * Why client-side only (no SSR): the app ships as a static bundle on
 * GitHub Pages. There is no Node runtime, so Supabase session refresh
 * happens entirely in the browser via @supabase/supabase-js's built-in
 * localStorage persistence.
 *
 * Next steps (if relevant):
 *   - If we ever start needing types for the `public` schema, run
 *     `supabase gen types` and import the generated Database type.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
 * The admin flow needs both env vars. The player flow works fine without
 * Supabase at all, so we export a "maybe-null" client and let callers
 * feature-detect. This is safer than throwing at import time: a missing
 * env var would otherwise crash the whole app.
 */
export const supabase =
    SUPABASE_URL && SUPABASE_ANON_KEY
        ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: {
                  persistSession: true,
                  autoRefreshToken: true,
                  detectSessionInUrl: false,
              },
          })
        : null;

export const isSupabaseConfigured = () => supabase !== null;
