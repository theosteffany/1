"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Button, Card } from "./ui";

type Message = { id: string; name: string; email: string; brand: string | null; message: string; read: boolean; created_at: string };

export function MessagesList() {
  const db = getBrowserClient();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    db.from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setMessages((data as Message[]) ?? []);
      });
  }, [db]);

  async function markRead(m: Message, read: boolean) {
    setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, read } : x)) ?? null);
    await db.from("contact_messages").update({ read }).eq("id", m.id);
  }
  async function remove(m: Message) {
    if (!confirm("Delete this message?")) return;
    const { error } = await db.from("contact_messages").delete().eq("id", m.id);
    if (error) return setError(error.message);
    setMessages((list) => list?.filter((x) => x.id !== m.id) ?? null);
  }

  return (
    <section>
      <h2 className="display text-3xl">Messages</h2>
      <p className="mt-2 text-sm text-ink/65">Enquiries sent through the contact form.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-3">
        {messages === null ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : messages.length === 0 ? (
          <Card className="text-center text-sm text-ink/60">No messages yet.</Card>
        ) : (
          messages.map((m) => (
            <Card key={m.id} className={cn("bg-white", !m.read && "border-olive/50")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-ember align-middle" />}
                    {m.name}
                    {m.brand && <span className="text-ink/55"> · {m.brand}</span>}
                  </p>
                  <a href={`mailto:${m.email}`} className="text-sm text-olive underline">
                    {m.email}
                  </a>
                </div>
                <time className="text-xs text-ink/50">{new Date(m.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{m.message}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => markRead(m, !m.read)}>
                  Mark as {m.read ? "unread" : "read"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(m)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
