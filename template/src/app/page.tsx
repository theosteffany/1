import { Fragment } from "react";
import { About } from "@/components/site/About";
import { Brands } from "@/components/site/Brands";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { Gallery } from "@/components/site/Gallery";
import { Hero } from "@/components/site/Hero";
import { SiteNav } from "@/components/site/SiteNav";
import { Work } from "@/components/site/Work";
import { Providers } from "@/components/ui/Providers";
import { getSiteContent } from "@/lib/content";
import type { SectionId } from "@/lib/types";

export default function HomePage() {
  const { settings, brands, categories, gallery, projects, formEndpoint } = getSiteContent();

  // Middle sections follow the order in site.config.ts → sections.
  // Empty collections hide themselves (and their menu link) automatically.
  const sections: Record<SectionId, { node: React.ReactNode; hasContent: boolean; label: string }> = {
    about: { label: "About", hasContent: true, node: <About about={settings.about} contact={settings.contact} /> },
    brands: { label: "Brands", hasContent: brands.length > 0, node: <Brands brands={brands} copy={settings.brands} /> },
    gallery: {
      label: "Gallery",
      hasContent: gallery.length > 0,
      node: <Gallery items={gallery} categories={categories} copy={settings.gallery} />,
    },
    work: { label: "Work", hasContent: projects.length > 0, node: <Work projects={projects} copy={settings.work} /> },
  };
  const shown = settings.layout.sections.filter((s) => s.visible && sections[s.id].hasContent);
  const navLinks = [
    ...shown.map((s) => ({ href: `#${s.id}`, label: sections[s.id].label })),
    { href: "#contact", label: "Contact" },
  ];

  return (
    <Providers>
      <SiteNav name={settings.hero.name} links={navLinks} />
      <main>
        <Hero hero={settings.hero} />
        {shown.map((s) => (
          <Fragment key={s.id}>{sections[s.id].node}</Fragment>
        ))}
        <Contact contact={settings.contact} formEndpoint={formEndpoint} />
      </main>
      <Footer name={settings.hero.name} tagline={settings.hero.tagline} />
    </Providers>
  );
}
