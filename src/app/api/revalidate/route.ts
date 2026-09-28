import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

// Called by the admin dashboard after each save so the public page updates immediately.
export async function POST() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Not an admin" }, { status: 403 });

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
