import { defaultSettings } from "./placeholder-content";
import type { SectionId, SectionSetting, SiteSettings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Fill any missing settings fields with defaults so new fields never break the page. */
export function mergeSettings(saved: DeepPartial<SiteSettings> | null | undefined): SiteSettings {
  const out = structuredClone(defaultSettings) as unknown as Record<string, Record<string, unknown>>;
  for (const [group, values] of Object.entries(saved ?? {})) {
    if (!values || typeof values !== "object" || !(group in out)) continue;
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) out[group][key] = value;
    }
  }
  const settings = out as unknown as SiteSettings;
  settings.layout.sections = normaliseSections(settings.layout.sections);
  return settings;
}

export const SECTION_LABELS: Record<SectionId, string> = {
  about: "About",
  brands: "Brands",
  gallery: "Gallery",
  work: "My Work",
};

/** Keep saved order, drop unknown ids, and append any section added in a later version. */
export function normaliseSections(saved: unknown): SectionSetting[] {
  const known = Object.keys(SECTION_LABELS) as SectionId[];
  const list = Array.isArray(saved) ? saved : [];
  const out: SectionSetting[] = [];
  for (const item of list) {
    const id = (item as SectionSetting)?.id;
    if (known.includes(id) && !out.some((s) => s.id === id)) {
      out.push({ id, visible: (item as SectionSetting).visible !== false });
    }
  }
  for (const id of known) if (!out.some((s) => s.id === id)) out.push({ id, visible: true });
  return out;
}
