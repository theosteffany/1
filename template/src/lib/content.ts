import { site } from "../../site.config";
import type { SiteContent, SiteSettings } from "./types";

const slug = (name: string) => `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** Turns the friendly site.config.ts into the shape the section components use. */
export function getSiteContent(): SiteContent {
  const settings: SiteSettings = {
    theme: {
      bone: site.colors.background,
      mist: site.colors.brandsBackground,
      ink: site.colors.text,
      olive: site.colors.accent,
      sand: site.colors.contactBackground,
      ember: site.colors.highlight,
    },
    layout: { sections: site.sections.map((id) => ({ id, visible: true })) },
    seo: {
      title: site.seo.title,
      description: site.seo.description,
      faviconUrl: "",
      ogImageUrl: site.seo.shareImage,
    },
    hero: {
      name: site.name,
      tagline: site.tagline,
      videoUrl: site.hero.video,
      videoMobileUrl: site.hero.videoMobile,
      posterUrl: site.hero.poster,
    },
    about: {
      eyebrow: site.about.eyebrow,
      heading: site.about.heading,
      bio: site.about.bio,
      photoUrl: site.about.photo,
      photoAlt: site.about.photoAlt,
      secondaryPhotoUrl: site.about.secondPhoto,
    },
    brands: { heading: site.brands.heading, subheading: site.brands.subheading },
    gallery: { heading: site.gallery.heading, subheading: site.gallery.subheading },
    work: { heading: site.work.heading, subheading: site.work.subheading },
    contact: {
      heading: site.contact.heading,
      intro: site.contact.intro,
      email: site.contact.email,
      instagram: site.contact.instagram,
      tiktok: site.contact.tiktok,
      location: site.contact.location,
      phone: site.contact.phone,
    },
  };

  return {
    settings,
    formEndpoint: site.contact.formEndpoint,
    brands: site.brands.logos.map((b, i) => ({
      id: `brand-${i}`,
      name: b.name,
      logo_url: b.logo || null,
      website_url: b.website || null,
      sort_order: i,
      visible: true,
    })),
    categories: site.gallery.categories.map((name, i) => ({ id: slug(name), name, sort_order: i })),
    gallery: site.gallery.photos.map((p, i) => ({
      id: `photo-${i}`,
      image_url: p.image,
      alt: p.alt,
      caption: p.caption || null,
      category_id: p.category ? slug(p.category) : null,
      orientation: p.shape,
      featured: p.featured,
      sort_order: i,
      visible: true,
    })),
    projects: site.work.projects.map((p, i) => ({
      id: `project-${i}`,
      title: p.title,
      brand: p.brand,
      description: p.description || null,
      category: p.category || null,
      video_url: p.video || null,
      thumbnail_url: p.thumbnail || null,
      orientation: p.shape,
      external_url: p.link || null,
      featured: p.featured,
      sort_order: i,
      visible: true,
    })),
  };
}

export const siteUrl = site.seo.siteUrl;
