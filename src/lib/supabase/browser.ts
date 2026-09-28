"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

export function getBrowserClient() {
  if (!client) client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
