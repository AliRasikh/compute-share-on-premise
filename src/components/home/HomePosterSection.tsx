"use client";

import { motion, useReducedMotion } from "framer-motion";
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      ) : null}
      <p className="mt-3 max-w-md text-lg font-semibold text-slate-800 sm:text-xl">
        {subtitle ?? "Your message here"}
      </p>
    </>
  );

  if (prefersReducedMotion) {
    return (
      <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 sm:min-h-[360px]">
        <div
          className="absolute inset-0 bg-gradient-to-tr from-slate-200 via-blue-100/60 to-slate-50"
          aria-hidden
        />
        <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-6 py-16 text-center">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[360px]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={posterStaggerContainer}
      whileHover={{
        y: -6,
        scale: 1.012,
        boxShadow: "0 24px 48px -16px rgba(15, 23, 42, 0.18)",
        borderColor: "rgba(148, 163, 184, 0.55)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-tr from-slate-200 via-blue-100/60 to-slate-50"
        aria-hidden
      />
      <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-6 py-16 text-center">
        {title ? (
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            variants={staggerItem}
          >
            {title}
          </motion.p>
        ) : null}
        <motion.p
          className="mt-3 max-w-md text-lg font-semibold text-slate-800 sm:text-xl"
          variants={staggerItem}
        >
          {subtitle ?? "Your message here"}
        </motion.p>
      </div>
    </motion.div>
  );
}
