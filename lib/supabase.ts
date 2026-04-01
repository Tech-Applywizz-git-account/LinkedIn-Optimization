// lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client or throw a better error for build-time safety
    // if the build is running without env vars.
    if (typeof window === "undefined") {
      console.warn("⚠️ Supabase keys missing! If this is a Vercel build, please add them to Project Settings.");
      return null as any; 
    }
  }

  return createBrowserClient(url!, key!);
}
