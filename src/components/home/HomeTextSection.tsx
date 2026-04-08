"use client";

import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/home/motionPresets";

type HomeTextSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  body: string;
};

export function HomeTextSection({ id, eyebrow, title, body }: HomeTextSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div id={id} className="mx-auto max-w-3xl px-4 text-center md:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
        ) : null}
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{body}</p>
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
    </motion.div>
  );
}
