import { Accent } from "@/components/ui/Accent";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import type { Brand, SiteSettings } from "@/lib/types";

function Logo({ brand, repeat = false }: { brand: Brand; repeat?: boolean }) {
  const inner = brand.logo_url ? (
    <Media
      src={brand.logo_url}
      alt={brand.name}
      width={220}
      height={88}
      loading="lazy"
      className="h-12 w-auto max-w-[10rem] object-contain opacity-70 grayscale transition duration-500 group-hover/logo:opacity-100 group-hover/logo:grayscale-0 md:h-14 md:max-w-[12rem]"
    />
  ) : (
    <span className="display text-xl opacity-70 md:text-2xl">{brand.name}</span>
  );
  return (
    <li
      className={`group/logo flex shrink-0 items-center px-7 md:px-12 ${repeat ? "motion-reduce:hidden" : ""}`}
      aria-hidden={repeat || undefined}
    >
      {brand.website_url ? (
        <a
          href={brand.website_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={brand.name}
          tabIndex={repeat ? -1 : undefined}
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}

export function Brands({ brands, copy }: { brands: Brand[]; copy: SiteSettings["brands"] }) {
  if (brands.length === 0) return null;

  // Repeat short lists so one "half" of the track is always wider than the screen.
  const minItems = 8;
  const base = Array.from({ length: Math.ceil(minItems / brands.length) }, () => brands).flat();
  const duration = `${Math.max(base.length * 4, 24)}s`;

  return (
    <section id="brands" className="section-y overflow-hidden border-y border-ink/10 bg-mist">
      <Reveal className="container-x mb-12 flex flex-col items-start justify-between gap-4 md:mb-16 md:flex-row md:items-end">
        <h2 className="display max-w-4xl text-[clamp(2.2rem,7vw,5.5rem)]">
          <Accent text={copy.heading} />
        </h2>
        {copy.subheading && <p className="accent text-lg text-ink/60 md:text-xl">{copy.subheading}</p>}
      </Reveal>

      <div
        className="group relative [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {/* Two identical halves; translating by -50% loops seamlessly. */}
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
          <ul className="flex items-center motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8">
            {base.map((b, i) => (
              <Logo key={`${b.id}-a${i}`} brand={b} repeat={i >= brands.length} />
            ))}
          </ul>
          <ul className="flex items-center motion-reduce:hidden" aria-hidden>
            {base.map((b, i) => (
              <Logo key={`${b.id}-b${i}`} brand={b} repeat />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
