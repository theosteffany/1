import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicClient } from "@/lib/supabase/server";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Honeypot: bots fill every field. Pretend success.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 200);
  const email = clean(body.email, 320);
  const brand = clean(body.brand, 200);
  const message = clean(body.message, 5000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please add your name, a valid email and a message." }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "The contact form isn't connected yet." },
      { status: 503 },
    );
  }

  const { error } = await getPublicClient()
    .from("contact_messages")
    .insert({ name, email, brand: brand || null, message });

  if (error) {
    console.error("[contact]", error);
    return NextResponse.json({ error: "Couldn't send your message right now." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
