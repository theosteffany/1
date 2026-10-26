"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight, CloseIcon } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { useModalBehaviour } from "@/components/ui/useModalBehaviour";
import { pad2 } from "@/lib/utils";
import type { GalleryItem } from "@/lib/types";

export function Lightbox({
  items,
  index,
  categoryName,
  onClose,
  onIndex,
}: {
  items: GalleryItem[];
  index: number | null;
  categoryName: (id: string | null) => string | undefined;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const open = index !== null;
  const count = items.length;
  const prev = () => index !== null && onIndex((index - 1 + count) % count);
  const next = () => index !== null && onIndex((index + 1) % count);
  useModalBehaviour(open, { onClose, onPrev: prev, onNext: next });

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) next();
    else if (info.offset.x > 60 || info.velocity.x > 400) prev();
  };

  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex flex-col bg-ink/[0.97] text-bone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="container-x flex items-center justify-between py-4">
            <span className="eyebrow tabular-nums text-bone/70">
              {pad2(index! + 1)} / {pad2(count)}
            </span>
            <button type="button" onClick={onClose} className="-mr-2 p-2" aria-label="Close" autoFocus>
              <CloseIcon className="h-7 w-7" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={item.id}
                className="absolute inset-0 touch-pan-y px-2 md:px-24"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={onDragEnd}
              >
                <div className="relative h-full w-full">
                  <Media src={item.image_url} alt={item.alt} fill sizes="100vw" className="pointer-events-none select-none object-contain" />
                </div>
              </motion.div>
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-bone/30 p-3 transition hover:bg-bone hover:text-ink md:block"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-bone/30 p-3 transition hover:bg-bone hover:text-ink md:block"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="container-x flex min-h-16 items-center justify-between gap-6 py-4 text-sm">
            <p className="accent text-lg text-bone/85">{item.caption}</p>
            <span className="eyebrow text-bone/50">{categoryName(item.category_id)}</span>
          </div>
          <p className="eyebrow pb-4 text-center text-[0.6rem] text-bone/40 md:hidden">Swipe to browse</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
