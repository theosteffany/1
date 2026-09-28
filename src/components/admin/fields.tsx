"use client";

import { MediaUpload } from "./MediaUpload";
import { Toggle, inputClass } from "./ui";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "email" | "image" | "video" | "select" | "toggle";
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

  if (field.type === "toggle") {
    return <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />;
  }

  return (
    <label className="block">
      <span className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-ember"> *</span>}
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
