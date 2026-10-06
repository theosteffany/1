"use client";

import { useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import { Button, inputClass } from "./ui";

const MB = 1024 * 1024;

export async function uploadToStorage(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const slug = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const path = `${folder}/${Date.now()}-${slug || "file"}.${ext}`;
  const db = getBrowserClient();
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function MediaUpload({
  value,
  onChange,
  kind,
  folder,
  onFile,
}: {
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
  folder: string;
  /** Optional hook to inspect the chosen file (e.g. detect orientation). */
  onFile?: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function handle(file: File) {
    setNote("");
    const sizeMb = (file.size / MB).toFixed(0);
    if (kind === "image" && file.size > 8 * MB) {
      setNote("Large image — consider exporting under 8MB (the site resizes automatically, but uploads are faster).");
    }
    setBusy(true);
    try {
      onFile?.(file);
      onChange(await uploadToStorage(file, folder));
    } catch (e) {
      const message = (e as Error).message || "";
      // Supabase rejects files over the project's upload limit (50MB on the free plan).
      const tooBig = /maximum allowed size|too large|payload|413/i.test(message);
      setNote(
        tooBig
          ? `This file is ${sizeMb}MB, which is over your Supabase upload limit (50MB on the free plan). ` +
              `Compress it to an MP4 under 50MB (e.g. HandBrake → "Fast 1080p30"), or raise the limit in ` +
              `Supabase → Storage → Settings on a paid plan.`
          : `Upload failed: ${message}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1.5 space-y-2">
      {value &&
        (kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-28 w-auto max-w-full rounded border border-ink/10 bg-white object-contain" />
        ) : (
          <video src={value} className="h-40 w-auto max-w-full rounded border border-ink/10 bg-black" controls muted playsInline preload="metadata" />
        ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Uploading…" : value ? `Replace ${kind}` : `Upload ${kind}`}
        </Button>
        {value && (
          <Button variant="danger" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept={kind === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = "";
          }}
        />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste a URL"
        className={`${inputClass} !mt-2 text-xs`}
      />
      {kind === "video" && !note && (
        <p className="text-xs text-ink/55">MP4 recommended · max 50MB per file on Supabase&apos;s free plan</p>
      )}
      {note && <p className="text-xs text-red-700">{note}</p>}
    </div>
  );
}
