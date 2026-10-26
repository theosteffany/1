"use client";

import { useMemo, useRef, useState } from "react";
import { Accent } from "@/components/ui/Accent";
import { FilterChips } from "@/components/ui/FilterChips";
import { PlayIcon } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import type { Project, SiteSettings } from "@/lib/types";
import { VideoModal } from "./VideoModal";

function ProjectCard({ project, onOpen, index }: { project: Project; onOpen: () => void; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const vertical = project.orientation === "vertical";

  // Hover preview only on devices with a real pointer — never autoplays on phones.
  const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const start = () => {
    if (!project.video_url || !canHover()) return;
    setPreviewing(true);
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
  };
  const stop = () => {
    videoRef.current?.pause();
    setPreviewing(false);
  };

  return (
    <Reveal
      delay={(index % 4) * 0.06}
      className={cn(vertical ? "row-span-5" : "col-span-2 row-span-3")}
    >
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={start}
        onMouseLeave={stop}
        onFocus={start}
        onBlur={stop}
        className="group relative block h-full w-full overflow-hidden rounded-sm bg-bone/5 text-left"
        aria-label={`Play ${project.brand} — ${project.title}`}
      >
        {project.thumbnail_url && (
          <Media
            src={project.thumbnail_url}
            alt=""
            fill
            loading="lazy"
            sizes={vertical ? "(min-width: 1024px) 25vw, 50vw" : "(min-width: 1024px) 50vw, 100vw"}
            className="object-cover transition-transform duration-[1.4s] ease-cine group-hover:scale-[1.04]"
          />
        )}
        {previewing && project.video_url && (
          <video
            ref={videoRef}
            src={project.video_url}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

        {project.featured && (
          <span className="eyebrow absolute left-3 top-3 rounded-full bg-ember px-3 py-1.5 text-[0.58rem] text-ink md:left-4 md:top-4">
            Featured
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-bone/40 text-bone backdrop-blur-[2px] transition duration-500 group-hover:scale-110 group-hover:bg-bone group-hover:text-ink md:right-4 md:top-4 md:h-12 md:w-12">
          <PlayIcon className="ml-0.5 h-4 w-4" />
        </span>

        <span className="absolute inset-x-0 bottom-0 p-3 text-bone md:p-5">
          <span className="eyebrow block text-[0.6rem] text-sand md:text-[0.66rem]">{project.brand}</span>
          <span className="mt-1.5 block font-display text-sm font-semibold leading-tight md:text-lg">{project.title}</span>
          {project.category && (
            <span className="accent mt-1 hidden text-sm text-bone/60 md:block">{project.category}</span>
          )}
        </span>
      </button>
    </Reveal>
  );
}

export function Work({ projects, copy }: { projects: Project[]; copy: SiteSettings["work"] }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [projects],
  );
  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  if (projects.length === 0) return null;

  return (
    <section id="work" className="section-y relative bg-ink text-bone">
      <div className="container-x">
        <Reveal className="mb-12 md:mb-16">
          <p className="eyebrow text-sand">{copy.heading}</p>
          <h2 className="display mt-5 max-w-6xl text-[clamp(2.8rem,10vw,9rem)]">
            <Accent text={copy.subheading} />
          </h2>
          <div className="mt-10">
            <FilterChips
              tone="dark"
              label="Filter projects"
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          </div>
        </Reveal>

        {/*
          Container-query sized rows: a vertical card spans 5 rows (≈9:16) and a
          horizontal card spans 2 columns × 3 rows (≈16:9), so mixed formats tile
          without awkward gaps.
        */}
        <div className="[container-type:inline-size]">
          <div
            className="grid grid-flow-dense grid-cols-2 gap-2 [--cols:2] [--gap:0.5rem] md:gap-4 md:[--gap:1rem] lg:grid-cols-4 lg:[--cols:4]"
            style={{
              gridAutoRows:
                "calc((100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols) * 16 / 9 / 5 - var(--gap) * 0.8)",
            }}
          >
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} onOpen={() => setOpen(i)} />
            ))}
          </div>
        </div>
      </div>

      <VideoModal projects={filtered} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}
