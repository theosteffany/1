import type { ThemeColors } from "./types";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#0F2E2C" → "15 46 44" (the format the CSS variables use). Invalid → null. */
export function hexToRgbTriplet(hex: string): string | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Builds the :root rule that applies the admin-chosen palette. */
export function themeCss(theme: ThemeColors) {
  const vars = (Object.entries(theme) as Array<[keyof ThemeColors, string]>)
    .map(([name, hex]) => {
      const rgb = hexToRgbTriplet(hex);
      return rgb ? `--${name}:${rgb};` : "";
    })
    .join("");
  return vars ? `:root{${vars}}` : "";
}
