"use client";

import { cn } from "@/lib/utils";

export function FilterChips({
  options,
  value,
  onChange,
  tone = "light",
  label,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  tone?: "light" | "dark";
  label: string;
}) {
  if (options.length <= 2) return null; // "All" + one category: nothing to filter
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "eyebrow shrink-0 rounded-full border px-4 py-2.5 transition-colors duration-300",
              tone === "light"
                ? active
                  ? "border-ink bg-ink text-bone"
                  : "border-ink/20 text-ink/70 hover:border-ink hover:text-ink"
                : active
                  ? "border-bone bg-bone text-ink"
                  : "border-bone/25 text-bone/70 hover:border-bone hover:text-bone",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
