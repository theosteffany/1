export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** "https://instagram.com/theo.ugc" → "@theo.ugc". Falls back to the raw value. */
export function handleFromUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("@")) return value;
  try {
    const path = new URL(value).pathname.replace(/^\/+|\/+$/g, "");
    return path ? `@${path.replace(/^@/, "")}` : value.replace(/^https?:\/\/(www\.)?/, "");
  } catch {
    return `@${value}`;
  }
}

/** Accepts "@handle" or a full URL and returns a URL for the given platform. */
export function socialUrl(value: string, platform: "instagram" | "tiktok") {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  const handle = value.replace(/^@/, "");
  return platform === "instagram" ? `https://instagram.com/${handle}` : `https://www.tiktok.com/@${handle}`;
}

export function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
