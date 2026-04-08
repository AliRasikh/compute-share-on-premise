"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CORIMB_LOGO_SRC, CORIMB_NAME } from "@/lib/brand";

const linkSpring = { type: "spring" as const, stiffness: 450, damping: 26 };

function BrandHomeLink({ className }: { className?: string }) {
  return (
    <Link
      href="/home"
      className={`inline-flex items-center gap-2 font-bold tracking-tight text-slate-900 ${className ?? "text-sm"}`}
    >
      <img
        src={CORIMB_LOGO_SRC}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
        aria-hidden
      />
      {CORIMB_NAME}
    </Link>
  );
}

export function MarketingHeader() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex w-full items-center justify-between gap-4">
          <BrandHomeLink />
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/" className="transition hover:text-slate-900">
              Log-in
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={linkSpring}>
          <BrandHomeLink />
        </motion.div>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={linkSpring}>
            <Link href="/" className="transition hover:text-slate-900">
              Log-in
            </Link>
          </motion.div>
        </nav>
      </div>
    </header>
  );
}
