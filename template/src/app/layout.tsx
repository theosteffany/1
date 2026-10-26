import type { Metadata, Viewport } from "next";
import { getSiteContent, siteUrl } from "@/lib/content";
import { themeCss } from "@/lib/theme";
import { archivo, instrumentSerif } from "./fonts";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { settings } = getSiteContent();
  const { title, description, faviconUrl, ogImageUrl } = settings.seo;
  return {
    metadataBase: new URL(siteUrl || "http://localhost:3000"),
    title,
    description,
    icons: { icon: faviconUrl || "/favicon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      images: [{ url: ogImageUrl || "/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl || "/og.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1E1B19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = getSiteContent();
  return (
    <html lang="en" className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* Palette from site.config.ts → colors (only valid hex is emitted, so safe to inline) */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings.theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
