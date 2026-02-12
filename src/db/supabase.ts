
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const expectedProjectRef = "xwieatrmtxtmnuxirbjw";

let isExpectedProject = false;
let isExpectedAnonKey = false;

function getRefFromAnonKey(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1])) as { ref?: unknown };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

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

if (supabaseAnonKey) {
  const refFromKey = getRefFromAnonKey(supabaseAnonKey);
  if (!refFromKey) {
    console.error("Invalid VITE_SUPABASE_ANON_KEY format.");
  } else {
    isExpectedAnonKey = refFromKey === expectedProjectRef;
    if (!isExpectedAnonKey) {
      console.error(
        `Supabase anon key mismatch: expected ref ${expectedProjectRef} but got ${refFromKey}`
      );
    }
  }
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && isExpectedProject && isExpectedAnonKey
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
            
