import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rsbldfayaefsnlrcxrbz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYmxkZmF5YWVmc25scmN4cmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzE3MDEsImV4cCI6MjA4NzA0NzcwMX0.ldj4O3DeAiiHKcfHcaSckIC-QLoj1mPuNVkzD1x2DHc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
