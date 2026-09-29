"use client";

import { useEffect, useState } from "react";
import { mergeSettings } from "@/lib/settings";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldInput, type FieldDef } from "./fields";
import { revalidateSite } from "./revalidate";
import { Button, Card } from "./ui";

type Group = { key: keyof SiteSettings; title: string; description?: string; fields: FieldDef[] };

const accentHelp = "Wrap words in *asterisks* to show them in the italic serif accent.";

export const settingsGroups: Group[] = [
  {
    key: "theme",
    title: "Colours",
    description:
      "Your site palette. Pick with the swatch or type a hex code, then Save. Keep text colours dark enough to read on the backgrounds. Mocha Mousse palette: #F3EFEA · #E6DFD7 · #C0B3A5 · #1E1B19 · #6D4F3E · #829BAB (Slate Gray #728394 also fits).",
    fields: [
      { key: "bone", label: "Main background", type: "color", help: "About, Gallery and most of the page." },
      { key: "mist", label: "Brands section background", type: "color" },
      { key: "sand", label: "Contact section background", type: "color" },
      { key: "ink", label: "Text & dark sections", type: "color", help: "All text, the My Work section, footer and buttons. Keep this dark." },
      { key: "olive", label: "Accent", type: "color", help: "Small labels, icons and button hover. Needs to be readable on the backgrounds." },
      { key: "ember", label: "Highlight", type: "color", help: "Featured badges and text selection (with dark text on top)." },
    ],
  },
  {
    key: "hero",
    title: "Hero",
    description: "The full-screen video at the top. Use a short (10–20s), silent, compressed MP4 for fast loading.",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "videoUrl", label: "Hero video (desktop / default)", type: "video", folder: "hero", wide: true },
      { key: "videoMobileUrl", label: "Hero video (mobile, optional)", type: "video", folder: "hero", help: "A vertical 9:16 cut for phones.", wide: true },
      { key: "posterUrl", label: "Poster image", type: "image", folder: "hero", help: "Shown while the video loads, and as a fallback.", wide: true },
    ],
  },
  {
    key: "about",
    title: "About",
    fields: [
      { key: "eyebrow", label: "Small label", type: "text" },
      { key: "heading", label: "Heading", type: "text", help: accentHelp },
      { key: "bio", label: "Biography", type: "textarea", help: "Separate paragraphs with a blank line. The first paragraph is shown larger." },
      { key: "photoUrl", label: "Main photo", type: "image", folder: "about" },
      { key: "photoAlt", label: "Main photo description (alt text)", type: "text" },
      { key: "secondaryPhotoUrl", label: "Small inset photo (desktop)", type: "image", folder: "about" },
    ],
  },
  {
    key: "brands",
    title: "Brands section",
    fields: [
      { key: "heading", label: "Heading", type: "text", help: accentHelp },
      { key: "subheading", label: "Subheading", type: "text" },
    ],
  },
  {
    key: "gallery",
    title: "Gallery section",
    fields: [
      { key: "heading", label: "Heading", type: "text", help: accentHelp },
      { key: "subheading", label: "Subheading", type: "text" },
    ],
  },
  {
    key: "work",
    title: "My Work section",
    fields: [
      { key: "heading", label: "Small label", type: "text" },
      { key: "subheading", label: "Headline", type: "text", help: accentHelp },
    ],
  },
  {
    key: "contact",
    title: "Contact & socials",
    fields: [
      { key: "heading", label: "Heading", type: "text", help: accentHelp },
      { key: "intro", label: "Intro text", type: "textarea" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone (optional)", type: "text", help: "Leave blank to hide." },
      { key: "instagram", label: "Instagram", type: "text", help: "Full URL or @handle." },
      { key: "tiktok", label: "TikTok", type: "text", help: "Full URL or @handle." },
      { key: "location", label: "Location", type: "text" },
    ],
  },
  {
    key: "seo",
    title: "SEO & sharing",
    fields: [
      { key: "title", label: "Page title", type: "text", wide: true },
      { key: "description", label: "Meta description", type: "textarea", help: "~150 characters, shown in Google results." },
      { key: "faviconUrl", label: "Favicon", type: "image", folder: "seo", help: "Square PNG or SVG, at least 256×256." },
      { key: "ogImageUrl", label: "Social preview image", type: "image", folder: "seo", help: "1200×630 JPG/PNG, shown when the link is shared." },
    ],
  },
];

export function SettingsEditor({ group }: { group: Group }) {
  const db = getBrowserClient();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; msg?: string }>({ kind: "idle" });

  useEffect(() => {
    db.from("site_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setStatus({ kind: "error", msg: error.message });
        setSettings(mergeSettings(data?.data));
      });
  }, [db, group.key]);

  async function save() {
    if (!settings) return;
    setStatus({ kind: "saving" });
    // Re-read so saving one tab never overwrites edits made in another.
    const { data: latest } = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
    const merged = { ...mergeSettings(latest?.data), [group.key]: settings[group.key] };
    const { error } = await db
      .from("site_settings")
      .upsert({ id: 1, data: merged, updated_at: new Date().toISOString() });
    if (error) return setStatus({ kind: "error", msg: error.message });
    setStatus({ kind: "saved" });
    revalidateSite();
  }

  if (!settings) return <p className="text-sm text-ink/60">Loading…</p>;
  const values = settings[group.key] as Record<string, unknown>;

  return (
    <section>
      <h2 className="display text-3xl">{group.title}</h2>
      {group.description && <p className="mt-2 max-w-xl text-sm text-ink/65">{group.description}</p>}
      <Card className="mt-6 bg-white">
        <div className="grid gap-5 md:grid-cols-2">
          {group.fields.map((f) => (
            <div key={f.key} className={cn(f.wide || f.type === "textarea" ? "md:col-span-2" : "")}>
              <FieldInput
                field={f}
                value={values[f.key]}
                onChange={(v) => {
                  setStatus({ kind: "idle" });
                  setSettings((s) => (s ? { ...s, [group.key]: { ...s[group.key], [f.key]: v ?? "" } } : s));
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Button onClick={save} disabled={status.kind === "saving"}>
            {status.kind === "saving" ? "Saving…" : "Save"}
          </Button>
          {status.kind === "saved" && <span className="text-sm text-olive">Saved — live on the site.</span>}
          {status.kind === "error" && <span className="text-sm text-red-700">{status.msg}</span>}
        </div>
      </Card>
    </section>
  );
}
