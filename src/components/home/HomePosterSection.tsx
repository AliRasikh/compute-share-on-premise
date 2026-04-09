"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedBlobField } from "@/components/home/AnimatedBlobField";
import { posterStaggerContainer, staggerItem } from "@/components/home/motionPresets";

type HomePosterSectionProps = {
  title?: string;
  subtitle?: string;
};

export function HomePosterSection({ title, subtitle }: HomePosterSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const inner = (
    <>
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718096]">{title}</p>
      ) : null}
      <p className="mt-3 text-lg text-[#1a202c] sm:text-xl">
        {subtitle ?? "Your message here"}
      </p>
    </>
  );

  const innerMotion = (
    <>
      {title ? (
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718096]"
          variants={staggerItem}
        >
          {title}
        </motion.p>
      ) : null}
      <motion.p
        className="mt-3 text-lg text-[#1a202c] sm:text-xl"
        variants={staggerItem}
      >
        {subtitle ?? "Your message here"}
      </motion.p>
    </>
  );

  return (
    <motion.div
      className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm sm:min-h-[360px]"
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView={prefersReducedMotion ? undefined : "visible"}
      viewport={prefersReducedMotion ? undefined : { once: true, amount: 0.3 }}
      variants={prefersReducedMotion ? undefined : posterStaggerContainer}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -6,
              scale: 1.012,
              boxShadow: "0 24px 48px -16px rgba(15, 23, 42, 0.12)",
              borderColor: "rgba(148, 163, 184, 0.45)",
            }
      }
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <AnimatedBlobField variant="lightPoster" />
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col items-center justify-center px-6 py-16 text-center">
        {prefersReducedMotion ? inner : innerMotion}
      </div>
    </motion.div>
  );
}
