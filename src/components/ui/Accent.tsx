import { Fragment } from "react";

/**
 * Renders editable heading text, turning *wrapped words* into the serif
 * italic accent. e.g. "UGC MADE TO *stop the scroll.*"
 */
export function Accent({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <em key={i} className="accent">
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
