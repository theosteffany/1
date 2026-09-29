import { cn } from "@/lib/utils";

export const inputClass =
  "mt-1.5 block w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variant === "primary" && "bg-ink text-bone hover:bg-olive",
        variant === "secondary" && "border border-ink/15 bg-white text-ink hover:border-ink/40",
        variant === "ghost" && "text-ink/70 hover:bg-ink/5 hover:text-ink",
        variant === "danger" && "text-red-700 hover:bg-red-50",
        className,
      )}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm"
    >
      <span className={cn("relative h-5 w-9 rounded-full transition", checked ? "bg-olive" : "bg-ink/20")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-lg border border-ink/10 bg-bone p-5 md:p-6", className)} />;
}
