import { defaultSettings } from "./placeholder-content";
import type { SiteSettings } from "./types";

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
  return out as unknown as SiteSettings;
}
