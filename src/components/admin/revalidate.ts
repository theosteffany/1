"use client";

/** Ask Next.js to rebuild the public page after a content change. */
export async function revalidateSite() {
  try {
    await fetch("/api/revalidate", { method: "POST" });
  } catch {
    // Non-fatal: the page also refreshes on its own every few minutes.
  }
}
