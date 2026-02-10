// Import the necessary Supabase package
import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL and public API key (replace these with your actual values)
const SUPABASE_URL = 'https://xwieatrmtxtmnuxirbjw.supabase.co';  // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aWVhdHJtdHh0bW51eGlyYmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTgzNTksImV4cCI6MjA4NjA3NDM1OX0.McRzIe64mupbC88Mqg_ZY_LdDWr96W2nsGZPotzreB4';  // Replace with your Supabase anon key

// Create the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the supabase client so it can be used in other files
export { supabase };