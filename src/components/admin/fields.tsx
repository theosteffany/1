"use client";

import { SECTION_LABELS, normaliseSections } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { MediaUpload } from "./MediaUpload";
import { Button, Toggle, inputClass } from "./ui";

function SectionOrder({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const sections = normaliseSections(value);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const fixedRow = (label: string, note: string) => (
    <li className="flex items-center justify-between rounded-md border border-dashed border-ink/15 px-4 py-3 text-sm text-ink/55">
      <span className="font-medium">{label}</span>
      <span className="text-xs">{note}</span>
    </li>
  );
  return (
    <ul className="space-y-2">
      {fixedRow("Hero", "always first")}
      {sections.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-md border border-ink/15 bg-white px-4 py-3",
            !s.visible && "opacity-60",
          )}
        >
          <span className="w-6 text-sm tabular-nums text-ink/40">{i + 1}</span>
          <span className="flex-1 font-medium">{SECTION_LABELS[s.id]}</span>
          <Toggle
            checked={s.visible}
            onChange={(visible) => onChange(sections.map((x) => (x.id === s.id ? { ...x, visible } : x)))}
            label={s.visible ? "Shown" : "Hidden"}
          />
          <span className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[s.id]} up`}>
              ↑
            </Button>
            <Button variant="secondary" size="sm" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label={`Move ${SECTION_LABELS[s.id]} down`}>
              ↓
            </Button>
          </span>
        </li>
      ))}
      {fixedRow("Contact", "always last")}
    </ul>
  );
}

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "email" | "image" | "video" | "select" | "toggle" | "color" | "sections";
  help?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  /** Storage folder for uploads. */
  folder?: string;
  /** Take the full row on wide forms. */
  wide?: boolean;
};

export function FieldInput({
  field,
  value,
  onChange,
  onFile,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  onFile?: (file: File) => void;
}) {
  const str = (value as string | null | undefined) ?? "";

  if (field.type === "sections") {
    return (
      <div>
        <span className="text-sm font-medium">{field.label}</span>
        {field.help && <span className="mb-3 mt-0.5 block text-xs text-ink/55">{field.help}</span>}
        <SectionOrder value={value} onChange={onChange} />
      </div>
    );
  }

  if (field.type === "toggle") {
    return <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />;
  }

  return (
    <label className="block">
      <span className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-700"> *</span>}
      </span>
      {field.help && <span className="mt-0.5 block text-xs text-ink/55">{field.help}</span>}
      {field.type === "textarea" ? (
        <textarea
          value={str}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder={field.placeholder}
          className={inputClass}
        />
      ) : field.type === "image" || field.type === "video" ? (
        <MediaUpload value={str} onChange={onChange} kind={field.type} folder={field.folder ?? "uploads"} onFile={onFile} />
      ) : field.type === "color" ? (
        <span className="mt-1.5 flex items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-11 w-14 cursor-pointer rounded-md border border-ink/15 bg-white p-1"
          />
          <input
            type="text"
            value={str}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#FFFFFF"
            maxLength={7}
            className={`${inputClass} !mt-0 w-32 font-mono uppercase`}
          />
        </span>
      ) : field.type === "select" ? (
        <select value={str} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </label>
  );
}
