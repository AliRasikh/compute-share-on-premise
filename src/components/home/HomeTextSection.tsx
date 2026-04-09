"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/home/motionPresets";

type HomeTextSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function HomeTextSection({ id, eyebrow, title, body, ctaLabel, ctaHref }: HomeTextSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const ctaButton = ctaLabel && ctaHref ? (
    <Link
      href={ctaHref}
      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
    >
      {ctaLabel}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </Link>
  ) : null;

  if (prefersReducedMotion) {
    return (
      <div id={id} className="mx-auto max-w-3xl px-4 text-center md:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
        ) : null}
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{body}</p>
        {ctaButton}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className="mx-auto max-w-3xl px-4 text-center md:px-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35, margin: "0px 0px -6% 0px" }}
      variants={staggerContainer}
    >
      {eyebrow ? (
        <motion.p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600" variants={staggerItem}>
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h2
        className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        variants={staggerItem}
      >
        {title}
      </motion.h2>
      <motion.p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg" variants={staggerItem}>
        {body}
      </motion.p>
      {ctaButton && (
        <motion.div variants={staggerItem}>
          {ctaButton}
        </motion.div>
      )}
    </motion.div>
  );
}
