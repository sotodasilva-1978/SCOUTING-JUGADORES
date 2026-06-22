import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder';

if (!isSupabaseConfigured) {
  console.info('Supabase URL or Anon Key is missing or placeholder. Database persistence is disabled.');
}

// Create a dummy client if not configured to avoid "Failed to fetch" spam
const createDummyClient = () => {
  const dummyResult = { data: [], error: null };
  const handler: ProxyHandler<any> = {
    get: (target, prop) => {
      // If the property is 'then', making it thenable (Promise-like)
      if (prop === 'then') {
        return (resolve: any) => resolve(dummyResult);
      }
      // Otherwise, return a function that returns a new proxy for chaining
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler) as any;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();
