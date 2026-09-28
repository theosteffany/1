import type { Metadata, Viewport } from "next";
import { getSiteContent } from "@/lib/content";
import { archivo, instrumentSerif } from "./fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  const { title, description, faviconUrl, ogImageUrl } = settings.seo;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    icons: { icon: faviconUrl || "/favicon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      images: [{ url: ogImageUrl || "/og" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl || "/og"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1C1B19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
