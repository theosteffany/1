import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content";

// Fallback social preview image, used until one is uploaded in /admin → SEO.
export async function GET() {
  const { settings } = await getSiteContent();
  const t = settings.theme;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: `linear-gradient(160deg, ${t.sand} 0%, ${t.olive} 100%)`,
          color: t.ink,
        }}
      >
        <div style={{ fontSize: 180, fontWeight: 900, letterSpacing: -6, lineHeight: 0.9 }}>
          {settings.hero.name}
        </div>
        <div style={{ fontSize: 32, letterSpacing: 10, marginTop: 24, color: t.bone }}>
          {settings.hero.tagline}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
