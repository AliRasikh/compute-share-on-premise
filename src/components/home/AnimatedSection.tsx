"use client";

import { motion, useReducedMotion } from "framer-motion";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds */
  delay?: number;
};

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <section className={className}>{children}</section>;
  }

  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 48, scale: 0.96, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.section>
  );
}
