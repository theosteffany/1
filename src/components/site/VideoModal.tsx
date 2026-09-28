"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, CloseIcon } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { useModalBehaviour } from "@/components/ui/useModalBehaviour";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function VideoModal({
  projects,
  index,
  onClose,
  onIndex,
}: {
  projects: Project[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const count = projects.length;
  const prev = () => index !== null && onIndex((index - 1 + count) % count);
  const next = () => index !== null && onIndex((index + 1) % count);
  useModalBehaviour(index !== null, { onClose, onPrev: prev, onNext: next });
  const p = index !== null ? projects[index] : null;
  const vertical = p?.orientation === "vertical";

  return (
    <AnimatePresence>
      {p && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${p.brand} — ${p.title}`}
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/95 text-bone backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <button
            type="button"
            onClick={onClose}
            className="fixed right-3 top-3 z-10 rounded-full bg-ink/60 p-2 md:right-6 md:top-6"
            aria-label="Close video"
            autoFocus
          >
            <CloseIcon className="h-7 w-7" />
          </button>

          <motion.div
            key={p.id}
            className={cn(
              "container-x flex min-h-full flex-col items-center justify-center gap-8 py-16 md:py-20",
              vertical ? "md:flex-row md:items-center md:gap-14" : "",
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden bg-black",
                vertical ? "aspect-[9/16] max-h-[78svh] max-w-[min(26rem,44svh)]" : "aspect-video max-w-5xl",
              )}
            >
              {p.video_url ? (
                <video
                  key={p.video_url}
                  src={p.video_url}
                  poster={p.thumbnail_url ?? undefined}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <>
                  {p.thumbnail_url && <Media src={p.thumbnail_url} alt="" fill sizes="50vw" className="object-cover opacity-60" />}
                  <p className="eyebrow absolute inset-0 flex items-center justify-center p-6 text-center">
                    Video placeholder — upload in /admin
                  </p>
                </>
              )}
            </div>

            <div className={cn("w-full", vertical ? "max-w-md" : "max-w-5xl md:grid md:grid-cols-[1fr_auto] md:gap-10")}>
              <div>
                <p className="eyebrow text-sand">
                  {p.brand}
                  {p.category && <span className="text-bone/40"> · {p.category}</span>}
                </p>
                <h3 className="display mt-3 text-3xl md:text-5xl">{p.title}</h3>
                {p.description && <p className="mt-5 leading-relaxed text-bone/70">{p.description}</p>}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-0 md:self-end">
                {p.external_url && (
                  <a
                    href={p.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow inline-flex items-center gap-2 rounded-full bg-bone px-6 py-3.5 text-ink transition hover:bg-sand"
                  >
                    View post <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                {count > 1 && (
                  <div className="flex gap-2">
                    <button type="button" onClick={prev} aria-label="Previous project" className="rounded-full border border-bone/30 p-3 transition hover:bg-bone hover:text-ink">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={next} aria-label="Next project" className="rounded-full border border-bone/30 p-3 transition hover:bg-bone hover:text-ink">
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
