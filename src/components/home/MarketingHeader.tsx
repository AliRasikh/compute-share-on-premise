"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const linkSpring = { type: "spring" as const, stiffness: 450, damping: 26 };

export function MarketingHeader() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/home" className="text-sm font-bold tracking-tight text-slate-900">
            Compute Exchange
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <span className="text-blue-600" aria-current="page">
              Home
            </span>
            <Link href="/" className="transition hover:text-slate-900">
              Console
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={linkSpring}>
          <Link href="/home" className="text-sm font-bold tracking-tight text-slate-900">
            Compute Exchange
          </Link>
        </motion.div>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <span className="text-blue-600" aria-current="page">
            Home
          </span>
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={linkSpring}>
            <Link href="/" className="transition hover:text-slate-900">
              Console
            </Link>
          </motion.div>
        </nav>
      </div>
    </header>
  );
}
