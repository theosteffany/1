"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Accent } from "@/components/ui/Accent";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { splitParagraphs } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

export function About({ about }: { about: SiteSettings["about"] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const insetY = useTransform(scrollYProgress, [0, 1], ["30%", "-20%"]);

  return (
    <section id="about" ref={ref} className="section-y relative overflow-hidden bg-bone">
      <div className="container-x grid grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-8">
        {/* Heading runs across the grid on desktop, overlapping the photo column */}
        <Reveal className="md:col-span-12">
          <p className="eyebrow text-olive">{about.eyebrow}</p>
          <h2 className="display mt-5 text-[clamp(3.6rem,15vw,13rem)]">
            <Accent text={about.heading} />
          </h2>
        </Reveal>

        <div className="relative md:col-span-6 md:col-start-7 md:row-span-2 md:-mt-24 lg:-mt-40">
          <motion.div
            className="relative aspect-[4/5] overflow-hidden bg-sand"
            style={reduce ? undefined : { y: photoY }}
          >
            {about.photoUrl && (
              <Media
                src={about.photoUrl}
                alt={about.photoAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </motion.div>
          {about.secondaryPhotoUrl && (
            <motion.div
              className="absolute -bottom-10 -left-4 hidden aspect-square w-[38%] overflow-hidden border-[10px] border-bone bg-sand md:block lg:-left-24"
              style={reduce ? undefined : { y: insetY }}
            >
              <Media src={about.secondaryPhotoUrl} alt="" fill sizes="20vw" className="object-cover" />
            </motion.div>
          )}
        </div>

        <div className="md:col-span-5 md:col-start-1 md:row-start-2 md:pt-6 lg:col-span-4 lg:col-start-2">
          {splitParagraphs(about.bio).map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p
                className={
                  i === 0
                    ? "font-serif text-[1.65rem] leading-[1.25] md:text-[2rem]"
                    : "mt-6 text-base leading-relaxed text-ink/75 md:text-[1.05rem]"
                }
              >
                {p}
              </p>
            </Reveal>
          ))}
          <Reveal delay={0.2} className="mt-10">
            <a
              href="#contact"
              className="eyebrow group inline-flex items-center gap-4 rounded-full bg-ink px-7 py-4 text-bone transition-colors duration-500 hover:bg-olive"
            >
              Work with me
              <span className="block h-px w-6 bg-current transition-all duration-500 ease-cine group-hover:w-10" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
