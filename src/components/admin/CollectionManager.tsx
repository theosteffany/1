"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { FieldInput, type FieldDef } from "./fields";
import { imageDimensions, uploadToStorage } from "./MediaUpload";
import { revalidateSite } from "./revalidate";
import { Button, Card, Toggle } from "./ui";

type Row = { id: string; sort_order: number; [key: string]: unknown };

export type CollectionConfig = {
  table: string;
  title: string;
  description?: string;
  itemLabel: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  summary: (row: Row) => { title: string; subtitle?: string; thumb?: string | null; square?: boolean };
  /** Inline quick toggles shown in the list (e.g. visible, featured). */
  quickToggles?: Array<{ key: string; label: string }>;
  /** React to a file picked in the form (e.g. auto-detect orientation). */
  onFile?: (file: File, patch: (values: Record<string, unknown>) => void) => void | Promise<void>;
  /** Drop many images at once — each becomes a new row. */
  bulkUpload?: {
    label: string;
    folder: string;
    build: (url: string, file: File, dims: { width: number; height: number } | null) => Record<string, unknown>;
  };
};

export function CollectionManager({ config }: { config: CollectionConfig }) {
  const db = getBrowserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // row id or "new"
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState("");
  const dragIndex = useRef<number | null>(null);
  const bulkInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await db.from(config.table).select("*").order("sort_order").order("created_at");
    if (error) setError(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [db, config.table]);

  useEffect(() => {
    load();
  }, [load]);

  const nextTopOrder = () => (rows.length ? Math.min(...rows.map((r) => r.sort_order)) - 1 : 0);

  function startNew() {
    setDraft({ ...config.defaults });
    setEditing("new");
  }
  function startEdit(row: Row) {
    setDraft({ ...row });
    setEditing(row.id);
  }

  async function save() {
    const missing = config.fields.find((f) => f.required && !draft[f.key]);
    if (missing) return setError(`"${missing.label}" is required.`);
    setSaving(true);
    setError("");
    const values = Object.fromEntries(config.fields.map((f) => [f.key, draft[f.key] === "" ? null : draft[f.key]]));
    const res =
      editing === "new"
        ? await db.from(config.table).insert({ ...values, sort_order: nextTopOrder() })
        : await db.from(config.table).update(values).eq("id", editing!);
    setSaving(false);
    if (res.error) return setError(res.error.message);
    setEditing(null);
    await load();
    revalidateSite();
  }

  async function remove(row: Row) {
    if (!confirm(`Delete this ${config.itemLabel}? This can't be undone.`)) return;
    const { error } = await db.from(config.table).delete().eq("id", row.id);
    if (error) return setError(error.message);
    setRows((r) => r.filter((x) => x.id !== row.id));
    revalidateSite();
  }

  async function quickToggle(row: Row, key: string) {
    const value = !row[key];
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, [key]: value } : x)));
    const { error } = await db.from(config.table).update({ [key]: value }).eq("id", row.id);
    if (error) {
      setError(error.message);
      load();
    } else revalidateSite();
  }

  async function reorder(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const changed = next
      .map((r, i) => ({ ...r, sort_order: i }))
      .filter((r, i) => rows.find((o) => o.id === r.id)?.sort_order !== i);
    setRows(next.map((r, i) => ({ ...r, sort_order: i })));
    const results = await Promise.all(
      changed.map((r) => db.from(config.table).update({ sort_order: r.sort_order }).eq("id", r.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setError(failed.error.message);
      load();
    } else revalidateSite();
  }

  async function bulk(files: FileList) {
    if (!config.bulkUpload) return;
    setError("");
    let order = nextTopOrder();
    const list = Array.from(files);
    for (const [i, file] of list.entries()) {
      setBulkBusy(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const [url, dims] = await Promise.all([uploadToStorage(file, config.bulkUpload.folder), imageDimensions(file)]);
        const { error } = await db
          .from(config.table)
          .insert({ ...config.defaults, ...config.bulkUpload.build(url, file, dims), sort_order: order-- });
        if (error) throw error;
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBulkBusy("");
    await load();
    revalidateSite();
  }

  const form = (
    <Card className="border-olive/40 bg-white">
      <div className="grid gap-5 md:grid-cols-2">
        {config.fields.map((f) => (
          <div key={f.key} className={cn(f.wide || f.type === "textarea" ? "md:col-span-2" : "")}>
            <FieldInput
              field={f}
              value={draft[f.key]}
              onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              onFile={config.onFile ? (file) => config.onFile!(file, (p) => setDraft((d) => ({ ...d, ...p }))) : undefined}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : editing === "new" ? `Add ${config.itemLabel}` : "Save changes"}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(null)}>
          Cancel
        </Button>
      </div>
    </Card>
  );

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-3xl">{config.title}</h2>
          {config.description && <p className="mt-2 max-w-xl text-sm text-ink/65">{config.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {config.bulkUpload && (
            <>
              <Button variant="secondary" disabled={Boolean(bulkBusy)} onClick={() => bulkInput.current?.click()}>
                {bulkBusy || config.bulkUpload.label}
              </Button>
              <input
                ref={bulkInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) bulk(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}
          <Button onClick={startNew} disabled={editing === "new"}>
            + Add {config.itemLabel}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {editing === "new" && <div className="mb-4">{form}</div>}

      {loading ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="text-center text-sm text-ink/60">No {config.itemLabel}s yet.</Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => {
            const s = config.summary(row);
            const isEditing = editing === row.id;
            return (
              <li
                key={row.id}
                draggable={!isEditing}
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null) reorder(dragIndex.current, i);
                  dragIndex.current = null;
                }}
              >
                <Card className={cn("flex flex-wrap items-center gap-4 !p-3", row.visible === false && "opacity-60")}>
                  <span className="hidden cursor-grab select-none px-1 text-ink/30 md:block" aria-hidden title="Drag to reorder">
                    ⋮⋮
                  </span>
                  <div className={cn("relative h-14 shrink-0 overflow-hidden rounded bg-sand", s.square ? "w-14" : "w-20")}>
                    {s.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    {s.subtitle && <p className="truncate text-xs text-ink/55">{s.subtitle}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {config.quickToggles?.map((t) => (
                      <Toggle key={t.key} checked={Boolean(row[t.key])} onChange={() => quickToggle(row, t.key)} label={t.label} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => reorder(i, i - 1)} disabled={i === 0} aria-label="Move up">
                      ↑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => reorder(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move down">
                      ↓
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => (isEditing ? setEditing(null) : startEdit(row))}>
                      {isEditing ? "Close" : "Edit"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(row)}>
                      Delete
                    </Button>
                  </div>
                </Card>
                {isEditing && <div className="mt-2">{form}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
