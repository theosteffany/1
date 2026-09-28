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

// Static page, refreshed on demand when content is saved in /admin
// (and at most every 5 minutes as a safety net).
export const revalidate = 300;

export default async function HomePage() {
  const { settings, brands, categories, gallery, projects, source } = await getSiteContent();

  return (
    <Providers>
      <SiteNav name={settings.hero.name} />
      <main>
        <Hero hero={settings.hero} />
        <About about={settings.about} />
        <Brands brands={brands} copy={settings.brands} />
        <Gallery items={gallery} categories={categories} copy={settings.gallery} />
        <Work projects={projects} copy={settings.work} />
        <Contact contact={settings.contact} />
      </main>
      <Footer name={settings.hero.name} tagline={settings.hero.tagline} />
      {source === "placeholder" && (
        <p className="fixed bottom-3 left-3 z-30 rounded-full bg-ember px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-bone shadow-lg">
          Placeholder content
        </p>
      )}
    </Providers>
  );
}
