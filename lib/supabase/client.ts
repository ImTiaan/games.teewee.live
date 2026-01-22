import { createClient } from '@supabase/supabase-js';

// Client for use in the browser and public-facing server components
// Note: This client is only valid if env vars are present (browser or hydrated server env)
export const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null!;

// Admin client for use in ingestion scripts and secure API routes (NEVER expose to client)
export const getServiceSupabase = () => {
  // Ensure env vars are loaded when running scripts
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
};
