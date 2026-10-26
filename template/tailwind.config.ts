import type { Config } from "tailwindcss";

// Every colour points at a CSS variable defined in src/app/globals.css.
// Change the palette there and the whole site follows.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: token("bone"),
        ink: token("ink"),
        olive: token("olive"),
        sand: token("sand"),
        ember: token("ember"),
        mist: token("mist"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      letterSpacing: {
        eyebrow: "0.32em",
      },
      transitionTimingFunction: {
        cine: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        kenburns: {
          from: { transform: "scale(1) translate3d(0,0,0)" },
          to: { transform: "scale(1.08) translate3d(-1.5%,-1%,0)" },
        },
        scrollcue: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
      },
      animation: {
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
