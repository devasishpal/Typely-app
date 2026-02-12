
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const expectedProjectRef = "xwieatrmtxtmnuxirbjw";

let isExpectedProject = false;
if (supabaseUrl) {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    isExpectedProject = hostname === `${expectedProjectRef}.supabase.co`;
    if (!isExpectedProject) {
      console.error(
        `Supabase project mismatch: expected ${expectedProjectRef}.supabase.co but got ${hostname}`
      );
    }
  } catch {
    console.error("Invalid VITE_SUPABASE_URL format.");
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && isExpectedProject);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
            
