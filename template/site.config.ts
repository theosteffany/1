// ════════════════════════════════════════════════════════════════════
//  YOUR WEBSITE — EDIT THIS ONE FILE
//
//  Everything on the site comes from here: your name, bio, photos,
//  videos, brands, colours and contact details.
//
//  • Change the text between the quotes "like this".
//  • Put your photos and videos in the  public/images  folder, then
//    write their path here, e.g.  "/images/me.jpg"
//    (or paste a full link to a file hosted elsewhere).
//  • Delete a whole { ... } block to remove an item; copy one to add more.
//  • Leave a value as "" to hide it.
// ════════════════════════════════════════════════════════════════════

export const site = {
  // ── Basics ────────────────────────────────────────────────────────
  name: "YOUR NAME",
  tagline: "UGC CREATOR — YOUR CITY",

  // How the site appears on Google and when the link is shared.
  seo: {
    title: "Your Name — UGC Creator",
    description:
      "Short-form UGC video and photo content for brands. Lifestyle, fitness, fashion and travel — shot natively for social.",
    // Your live web address, once you have one (used for share previews).
    siteUrl: "https://your-domain.com",
    // Optional share image (1200×630 .jpg or .png). Leave "" to auto-generate one.
    shareImage: "",
  },

  // ── Colours ───────────────────────────────────────────────────────
  // Any hex colour works. Try coolors.co for palettes.
  colors: {
    background: "#F3EFEA", // main page background
    brandsBackground: "#E6DFD7", // Brands section
    text: "#1E1B19", // text and dark sections
    accent: "#6D4F3E", // labels, icons, button hover
    contactBackground: "#C0B3A5", // Contact section
    highlight: "#829BAB", // small highlights, text selection
  },

  // ── Page order ────────────────────────────────────────────────────
  // The intro is always first and Contact always last. Reorder these,
  // or delete one to hide that section.
  sections: ["about", "brands", "gallery", "work"],

  // ── Intro (full-screen video at the top) ─────────────────────────
  hero: {
    video: "", // e.g. "/images/showreel.mp4" — keep it short and under ~15 MB
    videoMobile: "", // optional vertical cut for phones
    poster: "/placeholders/hero-poster.svg", // still image shown while the video loads
  },

  // ── About ─────────────────────────────────────────────────────────
  about: {
    eyebrow: "About me",
    heading: "ABOUT ME",
    // Leave a blank line between paragraphs.
    bio: `I'm a UGC creator making short-form video and photo content for brands.

I shoot the way people actually watch: hook in the first second, native pacing, natural light and real settings. Lifestyle, fitness, fashion and travel — delivered edit-ready for organic posts or paid ads.

Replace this with a little about who you are, what you love to shoot and how you like to work with brands.`,
    photo: "/placeholders/about.svg",
    photoAlt: "Portrait of me",
    secondPhoto: "/placeholders/square-3.svg",
  },

  // ── Brands ────────────────────────────────────────────────────────
  brands: {
    heading: "BRANDS I'VE WORKED WITH",
    subheading: "a few of the brands I've created for",
    logos: [
      { name: "Brand 01", logo: "/placeholders/brand-1.svg", website: "" },
      { name: "Brand 02", logo: "/placeholders/brand-2.svg", website: "" },
      { name: "Brand 03", logo: "/placeholders/brand-3.svg", website: "" },
      { name: "Brand 04", logo: "/placeholders/brand-4.svg", website: "" },
      { name: "Brand 05", logo: "/placeholders/brand-5.svg", website: "" },
      { name: "Brand 06", logo: "/placeholders/brand-6.svg", website: "" },
      { name: "Brand 07", logo: "/placeholders/brand-7.svg", website: "" },
      { name: "Brand 08", logo: "/placeholders/brand-8.svg", website: "" },
    ],
  },

  // ── Gallery (photos) ──────────────────────────────────────────────
  gallery: {
    heading: "GALLERY",
    subheading: "moments between takes",
    // Filter buttons shown above the photos.
    categories: ["Lifestyle", "Fitness", "Fashion", "Travel", "Brands"],
    // shape: "portrait" (tall), "landscape" (wide) or "square".
    // featured: true makes the photo bigger.
    photos: [
      { image: "/placeholders/portrait-1.svg", alt: "Lifestyle photo", category: "Lifestyle", shape: "portrait", featured: true, caption: "" },
      { image: "/placeholders/landscape-2.svg", alt: "Travel photo", category: "Travel", shape: "landscape", featured: false, caption: "" },
      { image: "/placeholders/portrait-3.svg", alt: "Fitness photo", category: "Fitness", shape: "portrait", featured: false, caption: "" },
      { image: "/placeholders/square-4.svg", alt: "Fashion photo", category: "Fashion", shape: "square", featured: false, caption: "" },
      { image: "/placeholders/portrait-5.svg", alt: "Brand photo", category: "Brands", shape: "portrait", featured: false, caption: "" },
      { image: "/placeholders/portrait-6.svg", alt: "Travel photo", category: "Travel", shape: "portrait", featured: false, caption: "" },
      { image: "/placeholders/landscape-1.svg", alt: "Lifestyle photo", category: "Lifestyle", shape: "landscape", featured: false, caption: "" },
      { image: "/placeholders/square-2.svg", alt: "Fitness photo", category: "Fitness", shape: "square", featured: false, caption: "" },
      { image: "/placeholders/portrait-3.svg", alt: "Fashion photo", category: "Fashion", shape: "portrait", featured: true, caption: "" },
      { image: "/placeholders/landscape-4.svg", alt: "Brand photo", category: "Brands", shape: "landscape", featured: false, caption: "" },
      { image: "/placeholders/square-5.svg", alt: "Lifestyle photo", category: "Lifestyle", shape: "square", featured: false, caption: "" },
      { image: "/placeholders/portrait-6.svg", alt: "Travel photo", category: "Travel", shape: "portrait", featured: false, caption: "" },
    ],
  },

  // ── My Work (videos) ──────────────────────────────────────────────
  work: {
    heading: "MY WORK",
    // Wrap words in *stars* to show them in the italic accent font.
    subheading: "UGC MADE TO *STOP THE SCROLL.*",
    // shape: "vertical" (9:16, TikTok/Reels) or "horizontal" (16:9).
    // link: optional — e.g. the live post on TikTok.
    projects: [
      { title: "Morning routine hook", brand: "Brand 01", category: "Skincare", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/vertical-1.svg", shape: "vertical", link: "", featured: true },
      { title: "Gym bag essentials", brand: "Brand 02", category: "Fitness", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/vertical-2.svg", shape: "vertical", link: "", featured: false },
      { title: "Weekend getaway edit", brand: "Brand 03", category: "Travel", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/horizontal-3.svg", shape: "horizontal", link: "", featured: false },
      { title: "Taste test reaction", brand: "Brand 04", category: "Food & Drink", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/vertical-4.svg", shape: "vertical", link: "", featured: false },
      { title: "Try-on haul", brand: "Brand 05", category: "Fashion", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/vertical-5.svg", shape: "vertical", link: "", featured: false },
      { title: "Unboxing, slow and simple", brand: "Brand 06", category: "Lifestyle", description: "A short line about the brief and the result.", video: "", thumbnail: "/placeholders/horizontal-6.svg", shape: "horizontal", link: "", featured: false },
    ],
  },

  // ── Contact ───────────────────────────────────────────────────────
  contact: {
    heading: "LET'S WORK TOGETHER.",
    intro: "Got a product, a brief or just an idea? Tell me about it and I'll get back to you within a couple of days.",
    email: "hello@example.com",
    instagram: "@your.handle", // "@handle" or a full link
    tiktok: "@your.handle",
    location: "Your City",
    phone: "",
    // Optional: get messages straight to your inbox with a free form service.
    // Create a form at formspree.io and paste its link here, e.g.
    // "https://formspree.io/f/abcdwxyz". Leave "" and the form opens the
    // visitor's email app instead.
    formEndpoint: "",
  },
} satisfies SiteConfig;

// ─── You don't need to edit anything below this line ─────────────────
type SiteConfig = {
  name: string;
  tagline: string;
  seo: { title: string; description: string; siteUrl: string; shareImage: string };
  colors: Record<"background" | "brandsBackground" | "text" | "accent" | "contactBackground" | "highlight", string>;
  sections: Array<"about" | "brands" | "gallery" | "work">;
  hero: { video: string; videoMobile: string; poster: string };
  about: { eyebrow: string; heading: string; bio: string; photo: string; photoAlt: string; secondPhoto: string };
  brands: { heading: string; subheading: string; logos: Array<{ name: string; logo: string; website: string }> };
  gallery: {
    heading: string;
    subheading: string;
    categories: string[];
    photos: Array<{
      image: string;
      alt: string;
      category: string;
      shape: "portrait" | "landscape" | "square";
      featured: boolean;
      caption: string;
    }>;
  };
  work: {
    heading: string;
    subheading: string;
    projects: Array<{
      title: string;
      brand: string;
      category: string;
      description: string;
      video: string;
      thumbnail: string;
      shape: "vertical" | "horizontal";
      link: string;
      featured: boolean;
    }>;
  };
  contact: {
    heading: string;
    intro: string;
    email: string;
    instagram: string;
    tiktok: string;
    location: string;
    phone: string;
    formEndpoint: string;
  };
};
