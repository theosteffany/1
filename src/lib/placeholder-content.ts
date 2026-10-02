import type { SiteContent, SiteSettings } from "./types";

// Shown until Supabase is connected, and used as defaults for any settings
// field that hasn't been filled in yet. Everything here is clearly marked as
// placeholder — no real brands, clients, stats or testimonials.

export const defaultSettings: SiteSettings = {
  theme: {
    bone: "#F3EFEA",
    mist: "#E6DFD7",
    ink: "#1E1B19",
    olive: "#6D4F3E",
    sand: "#C0B3A5",
    ember: "#829BAB",
  },
  seo: {
    title: "Theo — UGC Creator, Australia",
    description:
      "Short-form UGC video and photo content for brands. Lifestyle, fitness, fashion and travel — shot natively for social.",
    faviconUrl: "",
    ogImageUrl: "",
  },
  layout: {
    sections: [
      { id: "about", visible: true },
      { id: "brands", visible: true },
      { id: "gallery", visible: true },
      { id: "work", visible: true },
    ],
  },
  hero: {
    name: "THEO",
    tagline: "UGC CREATOR — AUS",
    videoUrl: "",
    videoMobileUrl: "",
    posterUrl: "/placeholders/hero-poster.svg",
  },
  about: {
    eyebrow: "About me",
    heading: "ABOUT ME",
    bio: [
      "[Placeholder bio — edit in /admin → Settings → About.] I'm Theo, a UGC creator based in Australia making short-form video and photo content for brands.",
      "I shoot the way people actually watch: hook in the first second, native pacing, natural light and real settings. Lifestyle, fitness, fashion and travel — delivered edit-ready for organic posts or paid ads.",
      "Replace this paragraph with a little about who you are, what you love to shoot and how you like to work with brands.",
    ].join("\n\n"),
    photoUrl: "/placeholders/about.svg",
    photoAlt: "Portrait of Theo (placeholder)",
    secondaryPhotoUrl: "/placeholders/square-3.svg",
  },
  brands: {
    heading: "BRANDS I'VE WORKED WITH",
    subheading: "Placeholder logos — add real brands in /admin",
  },
  gallery: {
    heading: "GALLERY",
    subheading: "moments between takes",
  },
  work: {
    heading: "MY WORK",
    subheading: "UGC MADE TO *STOP THE SCROLL.*",
  },
  contact: {
    heading: "LET'S WORK TOGETHER.",
    intro:
      "Got a product, a brief or just an idea? Tell me about it and I'll get back to you within a couple of days.",
    email: "hello@example.com",
    instagram: "@your.handle",
    tiktok: "@your.handle",
    location: "Australia",
    phone: "",
  },
};

const categories = [
  { id: "cat-lifestyle", name: "Lifestyle", sort_order: 0 },
  { id: "cat-fitness", name: "Fitness", sort_order: 1 },
  { id: "cat-fashion", name: "Fashion", sort_order: 2 },
  { id: "cat-travel", name: "Travel", sort_order: 3 },
  { id: "cat-brands", name: "Brands", sort_order: 4 },
];

const galleryPlan: Array<[keyof typeof catIds, "portrait" | "landscape" | "square", boolean]> = [
  ["lifestyle", "portrait", true],
  ["travel", "landscape", false],
  ["fitness", "portrait", false],
  ["fashion", "square", false],
  ["brands", "portrait", false],
  ["travel", "portrait", false],
  ["lifestyle", "landscape", false],
  ["fitness", "square", false],
  ["fashion", "portrait", true],
  ["brands", "landscape", false],
  ["lifestyle", "square", false],
  ["travel", "portrait", false],
];
const catIds = {
  lifestyle: "cat-lifestyle",
  fitness: "cat-fitness",
  fashion: "cat-fashion",
  travel: "cat-travel",
  brands: "cat-brands",
};

export const placeholderContent: SiteContent = {
  source: "placeholder",
  settings: defaultSettings,
  brands: Array.from({ length: 8 }, (_, i) => ({
    id: `brand-${i + 1}`,
    name: `Brand ${String(i + 1).padStart(2, "0")} (placeholder)`,
    logo_url: `/placeholders/brand-${i + 1}.svg`,
    website_url: null,
    sort_order: i,
    visible: true,
  })),
  categories,
  gallery: galleryPlan.map(([cat, orientation, featured], i) => ({
    id: `photo-${i + 1}`,
    image_url: `/placeholders/${orientation}-${(i % 6) + 1}.svg`,
    alt: `Placeholder ${cat} photo ${i + 1}`,
    caption: null,
    category_id: catIds[cat],
    orientation,
    featured,
    sort_order: i,
    visible: true,
  })),
  projects: [
    ["vertical", "Skincare", "Morning routine hook"],
    ["vertical", "Fitness", "Gym bag essentials"],
    ["horizontal", "Travel", "Weekend getaway edit"],
    ["vertical", "Food & Drink", "Taste test reaction"],
    ["vertical", "Fashion", "Try-on haul"],
    ["horizontal", "Lifestyle", "Unboxing, slow and simple"],
  ].map(([orientation, category, title], i) => ({
    id: `project-${i + 1}`,
    title: `${title} (placeholder)`,
    brand: `Brand ${String(i + 1).padStart(2, "0")}`,
    description:
      "Placeholder project — upload the video, thumbnail and details in /admin → Projects.",
    category,
    video_url: null,
    thumbnail_url: `/placeholders/${orientation}-${(i % 6) + 1}.svg`,
    orientation: orientation as "vertical" | "horizontal",
    external_url: null,
    featured: i === 0,
    sort_order: i,
    visible: true,
  })),
};
