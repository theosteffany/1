import Image, { type ImageProps } from "next/image";

/**
 * next/image wrapper. The site is exported as plain static files, so images
 * are served as-is (no image server needed) but still lazy-load.
 */
export function Media({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized {...props} />;
}
