"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

export function SiteNav({ name, links }: { name: string; links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* mix-blend-difference keeps the nav legible over video and light sections alike */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 text-bone mix-blend-difference">
        <nav className="container-x pointer-events-auto flex items-center justify-between py-5 md:py-7">
          <a href="#top" className="display text-lg tracking-tight md:text-xl" aria-label={`${name} — back to top`}>
            {name}
          </a>
          <ul className="hidden items-center gap-9 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="eyebrow group relative inline-block py-1">
                  {l.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-cine group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="eyebrow -mr-2 p-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-50 flex flex-col bg-ink text-bone md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-x flex items-center justify-between py-5">
              <span className="display text-lg">{name}</span>
              <button type="button" className="eyebrow -mr-2 p-2" onClick={() => setOpen(false)} autoFocus>
                Close
              </button>
            </div>
            <ul className="container-x mt-auto space-y-2 pb-16">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a href={l.href} onClick={() => setOpen(false)} className="display block text-[13vw]">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
