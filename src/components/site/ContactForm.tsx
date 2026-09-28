"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

const field =
  "peer w-full border-0 border-b border-ink/25 bg-transparent px-0 pb-3 pt-6 text-lg text-ink placeholder-transparent transition-colors focus:border-ink focus:outline-none focus:ring-0";
const label =
  "eyebrow pointer-events-none absolute left-0 top-0 text-[0.62rem] text-ink/55 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-[0.72rem] peer-focus:top-0 peer-focus:text-[0.62rem] peer-focus:text-ink";

function Field({ name, labelText, type = "text", required = true, textarea = false, autoComplete }: {
  name: string; labelText: string; type?: string; required?: boolean; textarea?: boolean; autoComplete?: string;
}) {
  return (
    <label className="relative block">
      {textarea ? (
        <textarea name={name} required={required} placeholder={labelText} rows={4} maxLength={5000} className={cn(field, "resize-none")} />
      ) : (
        <input name={name} type={type} required={required} placeholder={labelText} maxLength={320} autoComplete={autoComplete} className={field} />
      )}
      <span className={label}>
        {labelText}
        {!required && <span className="normal-case tracking-normal"> (optional)</span>}
      </span>
    </label>
  );
}

export function ContactForm({ fallbackEmail }: { fallbackEmail: string }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      form.reset();
      setStatus({ state: "sent" });
    } catch (err) {
      setStatus({ state: "error", message: (err as Error).message });
    }
  }

  if (status.state === "sent") {
    return (
      <div className="flex min-h-[22rem] flex-col justify-center" role="status">
        <p className="display text-4xl md:text-5xl">Thank you.</p>
        <p className="accent mt-4 text-2xl text-ink/70">Your message is in — I&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate={false}>
      <div className="grid gap-8 md:grid-cols-2">
        <Field name="name" labelText="Name" autoComplete="name" />
        <Field name="email" labelText="Email" type="email" autoComplete="email" />
      </div>
      <Field name="brand" labelText="Brand" required={false} autoComplete="organization" />
      <Field name="message" labelText="Message" textarea />
      {/* Honeypot — hidden from people, tempting to bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={status.state === "sending"}
          className="eyebrow group inline-flex items-center gap-4 rounded-full bg-ink px-8 py-4 text-bone transition-colors duration-500 hover:bg-olive disabled:opacity-60"
        >
          {status.state === "sending" ? "Sending…" : "Send message"}
          <span className="block h-px w-6 bg-current transition-all duration-500 ease-cine group-hover:w-10" />
        </button>
        {status.state === "error" && (
          <p className="text-sm text-ember" role="alert">
            {status.message}{" "}
            {fallbackEmail && (
              <>
                You can also email <a className="underline" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
