/**
 * Supabase Client - Initialized from environment variables
 * Uses the irm schema for all IRM Command data
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'irm';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Falling back to in-memory data.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    db: {
      schema: supabaseSchema,
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Get the configured schema name
 */
export function getSchema(): string {
  return supabaseSchema;
}

export default supabase;
