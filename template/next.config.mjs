/** @type {import('next').NextConfig} */
const nextConfig = {
  // Builds the whole site into plain HTML/CSS/JS in the `out` folder,
  // so it can be hosted for free on Netlify, Vercel, GitHub Pages, etc.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
