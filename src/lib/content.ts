import { cache } from "react";
import { placeholderContent } from "./placeholder-content";
import { mergeSettings } from "./settings";
import { isSupabaseConfigured } from "./supabase/config";
import { getPublicClient } from "./supabase/server";
import type { SiteContent } from "./types";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured) return placeholderContent;

  try {
    const db = getPublicClient();
    const [settings, brands, categories, gallery, projects] = await Promise.all([
      db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
      db.from("brands").select("*").eq("visible", true).order("sort_order"),
      db.from("gallery_categories").select("*").order("sort_order"),
      db.from("gallery_items").select("*").eq("visible", true).order("sort_order"),
      db.from("projects").select("*").eq("visible", true).order("sort_order"),
    ]);

    const firstError = [settings, brands, categories, gallery, projects].find((r) => r.error)?.error;
    if (firstError) throw firstError;

    return {
      source: "supabase",
      settings: mergeSettings(settings.data?.data),
      brands: brands.data ?? [],
      categories: categories.data ?? [],
      gallery: gallery.data ?? [],
      projects: projects.data ?? [],
    };
  } catch (error) {
    console.error("[content] Falling back to placeholder content:", error);
    return placeholderContent;
  }
});
