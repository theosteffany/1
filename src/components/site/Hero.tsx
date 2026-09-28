"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Media } from "@/components/ui/Media";
import type { SiteSettings } from "@/lib/types";

export function Hero({ hero }: { hero: SiteSettings["hero"] }) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Scroll-driven reveal: the section is 180svh tall with a sticky stage,
  // so the first screen of scrolling "plays" the title in over the video.
  const { scrollYProgress: rawProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Pass through a JS transform so Framer doesn't hand these off to native
  // ScrollTimeline, which mis-clamps sticky-section ranges in some browsers.
  const scrollYProgress = useTransform(rawProgress, (v) => Math.min(1, Math.max(0, v)));
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
  const shade = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.45, 0.6]);
  const nameOpacity = useTransform(scrollYProgress, [0.04, 0.34], [0, 1]);
  const nameY = useTransform(scrollYProgress, [0.04, 0.4], ["18%", "0%"]);
  const nameSpacing = useTransform(scrollYProgress, [0.04, 0.45], ["0.18em", "-0.02em"]);
  const tagOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const tagY = useTransform(scrollYProgress, [0.3, 0.55], [24, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Pick the mobile cut on small screens, and only attach the source after
  // hydration so the poster paints first (fast LCP).
  useEffect(() => {
    const url = window.matchMedia("(max-width: 767px)").matches && hero.videoMobileUrl ? hero.videoMobileUrl : hero.videoUrl;
    setVideoSrc(url || null);
  }, [hero.videoUrl, hero.videoMobileUrl]);

  // Pause the video when the hero is off-screen to save battery/bandwidth.
  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [videoSrc]);

  return (
    <section id="top" ref={ref} className="relative h-[180svh] bg-ink" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div className="absolute inset-0 will-change-transform" style={reduce ? undefined : { scale: videoScale }}>
          <Media
            src={hero.posterUrl || "/placeholders/hero-poster.svg"}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ${videoReady ? "opacity-0" : "opacity-100"} ${
              !videoSrc && !reduce ? "animate-[kenburns_24s_ease-in-out_infinite_alternate]" : ""
            }`}
          />
          {videoSrc && (
            <video
              ref={videoRef}
              key={videoSrc}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
              src={videoSrc}
              poster={hero.posterUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              onCanPlay={() => setVideoReady(true)}
            />
          )}
        </motion.div>

        <motion.div className="absolute inset-0 bg-ink" style={{ opacity: reduce ? 0.45 : shade }} aria-hidden />
        <div className="grain absolute inset-0" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden />

        <div className="container-x relative flex h-full flex-col items-center justify-center text-center text-bone">
          <motion.h1
            className="display text-[clamp(4.5rem,24vw,22rem)]"
            style={reduce ? undefined : { opacity: nameOpacity, y: nameY, letterSpacing: nameSpacing }}
          >
            {hero.name}
          </motion.h1>
          <motion.p
            className="eyebrow mt-5 text-[0.72rem] text-bone/90 md:mt-8 md:text-sm"
            style={reduce ? undefined : { opacity: tagOpacity, y: tagY }}
          >
            {hero.tagline}
          </motion.p>
        </div>

        <motion.div
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-bone/80"
          style={reduce ? undefined : { opacity: cueOpacity }}
          aria-hidden
        >
          <span className="eyebrow text-[0.62rem]">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-bone/25">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-bone" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
