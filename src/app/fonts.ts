import { Archivo, Instrument_Serif } from "next/font/google";

// Display + body: Archivo (variable width axis lets headings go wide).
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

// Editorial accent — use sparingly.
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
