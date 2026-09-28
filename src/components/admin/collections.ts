import type { CollectionConfig } from "./CollectionManager";
import { imageDimensions } from "./MediaUpload";

// Each collection in the dashboard is described here. To add a field:
// 1) add a column in supabase/schema.sql, 2) add it to src/lib/types.ts,
// 3) list it below — the form, list and saving all follow automatically.

const orientationFromDims = (d: { width: number; height: number } | null) =>
  !d ? "portrait" : d.width / d.height > 1.15 ? "landscape" : d.height / d.width > 1.15 ? "portrait" : "square";

export const brandsConfig: CollectionConfig = {
  table: "brands",
  title: "Brands",
  description: "Logos in the scrolling marquee. Transparent PNG or SVG logos look best. Drag or use the arrows to reorder.",
  itemLabel: "brand",
  fields: [
    { key: "name", label: "Brand name", type: "text", required: true },
    { key: "website_url", label: "Website (optional)", type: "url", placeholder: "https://" },
    { key: "logo_url", label: "Logo", type: "image", folder: "brands", wide: true, help: "If no logo is uploaded, the name is shown as text." },
    { key: "visible", label: "Show on site", type: "toggle" },
  ],
  defaults: { name: "", website_url: "", logo_url: "", visible: true },
  summary: (r) => ({ title: String(r.name), subtitle: (r.website_url as string) || undefined, thumb: r.logo_url as string }),
  quickToggles: [{ key: "visible", label: "Visible" }],
};

export const categoriesConfig: CollectionConfig = {
  table: "gallery_categories",
  title: "Gallery categories",
  description: "The filter tabs above the gallery. Categories with no photos are hidden automatically.",
  itemLabel: "category",
  fields: [{ key: "name", label: "Name", type: "text", required: true }],
  defaults: { name: "" },
  summary: (r) => ({ title: String(r.name) }),
};

export function galleryConfig(categories: Array<{ id: string; name: string }>): CollectionConfig {
  const catName = (id: unknown) => categories.find((c) => c.id === id)?.name;
  return {
    table: "gallery_items",
    title: "Gallery",
    description:
      "Portrait photos take two rows, landscape two columns; featured photos are shown large. Upload several at once with bulk upload, then set categories.",
    itemLabel: "photo",
    fields: [
      { key: "image_url", label: "Photo", type: "image", folder: "gallery", required: true, wide: true },
      { key: "alt", label: "Description (alt text)", type: "text", help: "Describe the photo for screen readers and SEO." },
      { key: "caption", label: "Caption (optional)", type: "text" },
      { key: "category_id", label: "Category", type: "select", options: categories.map((c) => ({ value: c.id, label: c.name })) },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        help: "Detected automatically on upload.",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
          { value: "square", label: "Square" },
        ],
      },
      { key: "featured", label: "Featured (shown large)", type: "toggle" },
      { key: "visible", label: "Show on site", type: "toggle" },
    ],
    defaults: { image_url: "", alt: "", caption: "", category_id: null, orientation: "portrait", featured: false, visible: true },
    summary: (r) => ({
      title: (r.alt as string) || (r.caption as string) || "Untitled photo",
      subtitle: [catName(r.category_id), r.orientation].filter(Boolean).join(" · "),
      thumb: r.image_url as string,
      square: true,
    }),
    quickToggles: [
      { key: "featured", label: "Featured" },
      { key: "visible", label: "Visible" },
    ],
    onFile: async (file, patch) => patch({ orientation: orientationFromDims(await imageDimensions(file)) }),
    bulkUpload: {
      label: "Bulk upload photos",
      folder: "gallery",
      build: (url, file, dims) => ({
        image_url: url,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        orientation: orientationFromDims(dims),
      }),
    },
  };
}

export const projectsConfig: CollectionConfig = {
  table: "projects",
  title: "Projects",
  description:
    "Your UGC videos. Upload a compressed MP4 plus a thumbnail (the first frame people see). Videos never autoplay on phones — they open in a player when tapped.",
  itemLabel: "project",
  fields: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "category", label: "Category", type: "text", placeholder: "e.g. Skincare, Fitness, Travel", help: "Used for the filter tabs." },
    {
      key: "orientation",
      label: "Format",
      type: "select",
      options: [
        { value: "vertical", label: "Vertical (9:16)" },
        { value: "horizontal", label: "Horizontal (16:9)" },
      ],
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "video_url", label: "Video", type: "video", folder: "projects" },
    { key: "thumbnail_url", label: "Thumbnail", type: "image", folder: "projects" },
    { key: "external_url", label: "External link (optional)", type: "url", placeholder: "https://www.tiktok.com/…", wide: true },
    { key: "featured", label: "Featured", type: "toggle" },
    { key: "visible", label: "Show on site", type: "toggle" },
  ],
  defaults: {
    title: "",
    brand: "",
    category: "",
    orientation: "vertical",
    description: "",
    video_url: "",
    thumbnail_url: "",
    external_url: "",
    featured: false,
    visible: true,
  },
  summary: (r) => ({
    title: `${r.brand ? `${r.brand} — ` : ""}${r.title}`,
    subtitle: [r.category, r.orientation, r.video_url ? null : "no video yet"].filter(Boolean).join(" · "),
    thumb: r.thumbnail_url as string,
  }),
  quickToggles: [
    { key: "featured", label: "Featured" },
    { key: "visible", label: "Visible" },
  ],
};
