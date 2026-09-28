"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { CollectionManager } from "./CollectionManager";
import { brandsConfig, categoriesConfig, galleryConfig, projectsConfig } from "./collections";
import { MessagesList } from "./MessagesList";
import { SettingsEditor, settingsGroups } from "./SettingsEditor";
import { Button, Card } from "./ui";

type Tab = { id: string; label: string; section: "Content" | "Collections" | "Inbox" };

const tabs: Tab[] = [
  ...settingsGroups.map((g) => ({ id: g.key, label: g.title, section: "Content" as const })),
  { id: "brands-list", label: "Brands", section: "Collections" },
  { id: "gallery-list", label: "Gallery", section: "Collections" },
  { id: "categories", label: "Gallery categories", section: "Collections" },
  { id: "projects", label: "Projects", section: "Collections" },
  { id: "messages", label: "Messages", section: "Inbox" },
];

export function AdminDashboard() {
  const db = getBrowserClient();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "not-admin">("loading");
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState("hero");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === fromHash)) setTab(fromHash);
    (async () => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) return router.replace("/admin/login");
      setEmail(user.email ?? "");
      const { data } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
      setState(data ? "ok" : "not-admin");
    })();
  }, [db, router]);

  const loadCategories = useCallback(async () => {
    const { data } = await db.from("gallery_categories").select("id,name").order("sort_order");
    setCategories(data ?? []);
  }, [db]);

  useEffect(() => {
    if (tab === "gallery-list") loadCategories();
  }, [tab, loadCategories]);

  const gallery = useMemo(() => galleryConfig(categories), [categories]);

  function go(id: string) {
    setTab(id);
    setMenuOpen(false);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }

  async function signOut() {
    await db.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (state === "loading") return <p className="p-10 text-sm text-ink/60">Loading…</p>;

  if (state === "not-admin") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <Card className="bg-white">
          <h1 className="display text-3xl">Not an admin yet</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/75">
            You&apos;re signed in as <strong>{email}</strong>, but this account can&apos;t edit content. In Supabase → SQL
            Editor, run:
          </p>
          <pre className="mt-4 overflow-x-auto rounded bg-ink p-4 text-xs text-bone">
            {`insert into public.admins (user_id)\nselect id from auth.users where email = '${email}';`}
          </pre>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => location.reload()}>I&apos;ve done that</Button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const settingsGroup = settingsGroups.find((g) => g.key === tab);
  const current = tabs.find((t) => t.id === tab);

  return (
    <div className="md:flex">
      <aside
        className={cn(
          "border-ink/10 bg-bone md:sticky md:top-0 md:flex md:h-svh md:w-64 md:shrink-0 md:flex-col md:border-r",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 md:border-0 md:py-6">
          <div>
            <p className="display text-xl">Admin</p>
            <p className="max-w-[12rem] truncate text-xs text-ink/55">{email}</p>
          </div>
          <Button variant="secondary" size="sm" className="md:hidden" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? "Close" : current?.label ?? "Menu"}
          </Button>
        </div>
        <nav className={cn("flex-1 overflow-y-auto px-3 pb-4", menuOpen ? "block" : "hidden md:block")}>
          {(["Content", "Collections", "Inbox"] as const).map((section) => (
            <div key={section} className="mt-4">
              <p className="eyebrow px-2 text-[0.6rem] text-ink/45">{section}</p>
              <ul className="mt-2 space-y-0.5">
                {tabs
                  .filter((t) => t.section === section)
                  .map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => go(t.id)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm transition",
                          tab === t.id ? "bg-ink text-bone" : "hover:bg-ink/5",
                        )}
                      >
                        {t.label}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div className="mt-6 space-y-1 border-t border-ink/10 px-1 pt-4">
            <a href="/" target="_blank" className="block rounded-md px-2 py-2 text-sm hover:bg-ink/5">
              View site ↗
            </a>
            <button type="button" onClick={signOut} className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ink/5">
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-4xl">
          {settingsGroup && <SettingsEditor key={settingsGroup.key} group={settingsGroup} />}
          {tab === "brands-list" && <CollectionManager key="brands" config={brandsConfig} />}
          {tab === "gallery-list" && <CollectionManager key="gallery" config={gallery} />}
          {tab === "categories" && <CollectionManager key="categories" config={categoriesConfig} />}
          {tab === "projects" && <CollectionManager key="projects" config={projectsConfig} />}
          {tab === "messages" && <MessagesList />}
        </div>
      </main>
    </div>
  );
}
