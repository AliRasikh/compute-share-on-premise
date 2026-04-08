"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeroAnimatedBackground } from "@/components/home/HeroAnimatedBackground";
import { CORIMB_LOGO_SRC, CORIMB_NAME } from "@/lib/brand";
import { staggerContainer, staggerItem } from "@/components/home/motionPresets";

const ctaRowClassName =
  "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start";

const primaryHover = {
  scale: 1.04,
  boxShadow: "0 20px 44px -10px rgba(37, 99, 235, 0.55)",
};
const primaryTap = { scale: 0.96 };

const secondaryHover = {
  scale: 1.03,
  boxShadow: "0 16px 40px -14px rgba(255, 255, 255, 0.12)",
  borderColor: "rgba(255, 255, 255, 0.45)",
};
const secondaryTap = { scale: 0.97 };

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();

  const ctasStatic = (
    <>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600"
      >
        Start compute
      </Link>
      <Link
        href="/home#partner"
        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
      >
        Become a partner
      </Link>
    </>
  );

  const ctasMotion = (
    <div className={ctaRowClassName}>
      <motion.div
        className="inline-flex w-full sm:w-auto"
        whileHover={primaryHover}
        whileTap={primaryTap}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-600 sm:w-auto"
        >
          Start compute
        </Link>
      </motion.div>
      <motion.div
        className="inline-flex w-full sm:w-auto"
        whileHover={secondaryHover}
        whileTap={secondaryTap}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
      >
        <Link
          href="/home#partner"
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 sm:w-auto"
        >
          Become a partner
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 px-6 py-16 shadow-xl sm:px-10 sm:py-20 md:min-h-[min(70vh,640px)] md:py-24">
      <HeroAnimatedBackground />
      {prefersReducedMotion ? (
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <img
              src={CORIMB_LOGO_SRC}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{CORIMB_NAME}</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Trade compute. Run workloads. Stay in control.
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            A marketplace-style view of GPU and CPU capacity—built for teams who want clarity before they
            scale.
          </p>
          <div className={ctaRowClassName}>{ctasStatic}</div>
        </div>
      ) : (
        <motion.div
          className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 text-center md:text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.28, margin: "0px 0px -10% 0px" }}
          variants={staggerContainer}
        >
          <motion.div
            className="flex items-center justify-center gap-3 md:justify-start"
            variants={staggerItem}
          >
            <img
              src={CORIMB_LOGO_SRC}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{CORIMB_NAME}</p>
          </motion.div>
          <motion.h1
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
            variants={staggerItem}
          >
            Trade compute. Run workloads. Stay in control.
          </motion.h1>
          <motion.p className="text-base text-slate-300 sm:text-lg" variants={staggerItem}>
            A marketplace-style view of GPU and CPU capacity—built for teams who want clarity before they
            scale.
          </motion.p>
          <motion.div variants={staggerItem}>{ctasMotion}</motion.div>
        </motion.div>
      )}
    </div>
  );
}
