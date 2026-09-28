import Image, { type ImageProps } from "next/image";

/**
 * next/image wrapper. Supabase + local raster images are optimised and served
 * at responsive sizes; SVG placeholders and other external hosts are passed
 * straight through.
 */
export function Media({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  const optimisable =
    !src.endsWith(".svg") && (src.startsWith("/") || /^https:\/\/[^/]+\.supabase\.co\//.test(src));
  return <Image src={src} alt={alt} unoptimized={!optimisable} {...props} />;
}
