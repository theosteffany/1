// Content model shared by the public site, the admin dashboard and Supabase.
// Collections (brands, gallery, projects) live in their own tables so they can
// grow indefinitely; one-off copy lives in a single JSON settings row so new
// fields can be added without a database migration.

export interface ThemeColors {
  bone: string; // main background
  mist: string; // Brands section background
  ink: string; // text + dark sections
  olive: string; // accent: labels, icons, button hover
  sand: string; // Contact section background
  ember: string; // highlight: badges, text selection
}

export interface SiteSettings {
  theme: ThemeColors;
  seo: {
    title: string;
    description: string;
    faviconUrl: string;
    ogImageUrl: string;
  };
  hero: {
    name: string;
    tagline: string;
    videoUrl: string;
    videoMobileUrl: string;
    posterUrl: string;
  };
  about: {
    eyebrow: string;
    heading: string;
    bio: string; // paragraphs separated by blank lines
    photoUrl: string;
    photoAlt: string;
    secondaryPhotoUrl: string;
  };
  brands: {
    heading: string;
    subheading: string;
  };
  gallery: {
    heading: string;
    subheading: string;
  };
  work: {
    heading: string;
    subheading: string;
  };
  contact: {
    heading: string;
    intro: string;
    email: string;
    instagram: string;
    tiktok: string;
    location: string;
    phone: string;
  };
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  visible: boolean;
}

export interface GalleryCategory {
  id: string;
  name: string;
  sort_order: number;
}

export type ImageOrientation = "portrait" | "landscape" | "square";

export interface GalleryItem {
  id: string;
  image_url: string;
  alt: string;
  caption: string | null;
  category_id: string | null;
  orientation: ImageOrientation;
  featured: boolean;
  sort_order: number;
  visible: boolean;
}

export type VideoOrientation = "vertical" | "horizontal";

export interface Project {
  id: string;
  title: string;
  brand: string;
  description: string | null;
  category: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  orientation: VideoOrientation;
  external_url: string | null;
  featured: boolean;
  sort_order: number;
  visible: boolean;
}

export interface SiteContent {
  settings: SiteSettings;
  brands: Brand[];
  categories: GalleryCategory[];
  gallery: GalleryItem[];
  projects: Project[];
  source: "supabase" | "placeholder";
}
