"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Accent } from "@/components/ui/Accent";
import { FilterChips } from "@/components/ui/FilterChips";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import type { GalleryCategory, GalleryItem, SiteSettings } from "@/lib/types";
import { Lightbox } from "./Lightbox";

const PAGE = 12;

// Grid spans give an editorial masonry feel while keeping the admin's order.
function spanFor(item: GalleryItem) {
  if (item.featured) return "col-span-2 row-span-2 md:row-span-3";
  if (item.orientation === "portrait") return "row-span-2";
  if (item.orientation === "landscape") return "col-span-2";
  return "";
}

function sizesFor(item: GalleryItem) {
  return item.featured || item.orientation === "landscape"
    ? "(min-width: 768px) 50vw, 100vw"
    : "(min-width: 768px) 25vw, 50vw";
}

export function Gallery({
  items,
  categories,
  copy,
}: {
  items: GalleryItem[];
  categories: GalleryCategory[];
  copy: SiteSettings["gallery"];
}) {
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const usedCategories = useMemo(
    () => categories.filter((c) => items.some((i) => i.category_id === c.id)),
    [categories, items],
  );
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category_id === filter)),
    [filter, items],
  );
  const visible = filtered.slice(0, limit);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  if (items.length === 0) return null;

  return (
    <section id="gallery" className="section-y bg-bone">
      <div className="container-x">
        <Reveal className="mb-10 space-y-8 md:mb-14">
          <div>
            <h2 className="display text-[clamp(3.6rem,15vw,13rem)]">
              <Accent text={copy.heading} />
            </h2>
            {copy.subheading && <p className="accent mt-3 text-xl text-ink/60 md:text-2xl">{copy.subheading}</p>}
          </div>
          <FilterChips
            label="Filter gallery"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setLimit(PAGE);
            }}
            options={[{ value: "all", label: "All" }, ...usedCategories.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </Reveal>

        <motion.ul
          layout
          className="grid grid-flow-dense auto-rows-[clamp(8.5rem,21vw,19rem)] grid-cols-2 gap-2 md:grid-cols-4 md:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.05 }}
                className={cn("relative", spanFor(item))}
              >
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative block h-full w-full overflow-hidden bg-sand"
                  aria-label={`Open photo: ${item.alt || item.caption || "gallery image"}`}
                >
                  <Media
                    src={item.image_url}
                    alt={item.alt}
                    fill
                    loading="lazy"
                    sizes={sizesFor(item)}
                    className="object-cover transition-transform duration-[1.4s] ease-cine group-hover:scale-[1.05]"
                  />
                  {(item.caption || categoryName(item.category_id)) && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-3 bg-gradient-to-t from-ink/70 to-transparent p-3 text-left text-bone opacity-0 transition duration-500 ease-cine group-hover:translate-y-0 group-hover:opacity-100 md:p-5">
                      <span className="accent text-base md:text-lg">{item.caption}</span>
                      <span className="eyebrow text-[0.6rem] text-bone/80">{categoryName(item.category_id)}</span>
                    </span>
                  )}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {filtered.length > limit && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="eyebrow rounded-full border border-ink px-8 py-4 transition-colors duration-300 hover:bg-ink hover:text-bone"
            >
              Show more
            </button>
          </div>
        )}
      </div>

      <Lightbox
        items={filtered}
        index={lightbox}
        categoryName={categoryName}
        onClose={() => setLightbox(null)}
        onIndex={setLightbox}
      />
    </section>
  );
}
