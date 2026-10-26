"use client";

import { useEffect, useRef } from "react";

/** Scroll-lock, Escape/arrow keys and focus return for modal overlays. */
export function useModalBehaviour(
  open: boolean,
  { onClose, onPrev, onNext }: { onClose: () => void; onPrev?: () => void; onNext?: () => void },
) {
  const handlers = useRef({ onClose, onPrev, onNext });
  handlers.current = { onClose, onPrev, onNext };

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.onClose();
      if (e.key === "ArrowLeft") handlers.current.onPrev?.();
      if (e.key === "ArrowRight") handlers.current.onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);
}
