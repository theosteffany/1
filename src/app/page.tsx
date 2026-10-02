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

// Static page, refreshed on demand when content is saved in /admin
// (and at most every 5 minutes as a safety net).
export const revalidate = 300;

export default async function HomePage() {
  const { settings, brands, categories, gallery, projects, source } = await getSiteContent();

  // Middle sections follow the order and on/off switches in /admin → Page layout.
  // Empty collections hide themselves (and their menu link) automatically.
  const sections: Record<SectionId, { node: React.ReactNode; hasContent: boolean; label: string }> = {
    about: { label: "About", hasContent: true, node: <About about={settings.about} /> },
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
        <Contact contact={settings.contact} />
      </main>
      <Footer name={settings.hero.name} tagline={settings.hero.tagline} />
      {source === "placeholder" && (
        <p className="fixed bottom-3 left-3 z-30 rounded-full bg-ember px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink shadow-lg">
          Placeholder content
        </p>
      )}
    </Providers>
  );
}
