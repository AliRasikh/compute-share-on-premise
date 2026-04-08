"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Soft aurora-style blobs: heavily blurred circles drifting on loop.
 * Uses framer-motion (already in the project) — no extra animation dependency.
 */
type BlobDef = {
  id: number;
  size: number;
  left: string;
  top: string;
  background: string;
  x: number[];
  y: number[];
  duration: number;
  delay: number;
  scale: number[];
};

/** vs original ~20s loops: 3× faster, then 2× again → divide base seconds by 6 */
const BLOB_TIME_DIV = 6;

/** 10% less blur than previous 56px */
const BLOB_BLUR_PX = 56 * 0.9;

const BLOBS: BlobDef[] = [
  {
    id: 0,
    size: 320,
    left: "8%",
    top: "12%",
    background: "rgba(59, 130, 246, 0.42)",
    x: [0, 45, -28, 22, 0],
    y: [0, -38, 24, -18, 0],
    duration: 22 / BLOB_TIME_DIV,
    delay: 0,
    scale: [1, 1.08, 0.95, 1.04, 1],
  },
  {
    id: 1,
    size: 260,
    left: "62%",
    top: "8%",
    background: "rgba(99, 102, 241, 0.38)",
    x: [0, -36, 30, -14, 0],
    y: [0, 28, -22, 16, 0],
    duration: 19 / BLOB_TIME_DIV,
    delay: 1.2 / BLOB_TIME_DIV,
    scale: [1, 0.92, 1.06, 0.98, 1],
  },
  {
    id: 2,
    size: 220,
    left: "48%",
    top: "52%",
    background: "rgba(14, 165, 233, 0.35)",
    x: [0, 32, -40, 18, 0],
    y: [0, -30, 20, -24, 0],
    duration: 17 / BLOB_TIME_DIV,
    delay: 0.4 / BLOB_TIME_DIV,
    scale: [1, 1.05, 0.94, 1.02, 1],
  },
  {
    id: 3,
    size: 200,
    left: "-5%",
    top: "58%",
    background: "rgba(129, 140, 248, 0.32)",
    x: [0, 55, -20, 35, 0],
    y: [0, 18, -32, 12, 0],
    duration: 24 / BLOB_TIME_DIV,
    delay: 2 / BLOB_TIME_DIV,
    scale: [1, 0.96, 1.07, 1, 1],
  },
  {
    id: 4,
    size: 180,
    left: "72%",
    top: "42%",
    background: "rgba(56, 189, 248, 0.28)",
    x: [0, -24, 38, -16, 0],
    y: [0, -26, 18, -12, 0],
    duration: 20 / BLOB_TIME_DIV,
    delay: 0.8 / BLOB_TIME_DIV,
    scale: [1, 1.04, 0.93, 1.03, 1],
  },
  {
    id: 5,
    size: 140,
    left: "35%",
    top: "-8%",
    background: "rgba(147, 197, 253, 0.3)",
    x: [0, 20, -32, 14, 0],
    y: [0, 40, -18, 22, 0],
    duration: 21 / BLOB_TIME_DIV,
    delay: 1.6 / BLOB_TIME_DIV,
    scale: [1, 0.95, 1.06, 1, 1],
  },
];

export function HeroAnimatedBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Base */}
      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />

      {prefersReducedMotion ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 60%, rgba(148,163,184,0.2), transparent 40%)",
          }}
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
            {BLOBS.map((b) => (
              <motion.div
                key={b.id}
                className="absolute rounded-full will-change-transform"
                style={{
                  width: b.size,
                  height: b.size,
                  left: b.left,
                  top: b.top,
                  background: b.background,
                  filter: `blur(${BLOB_BLUR_PX}px)`,
                }}
                initial={{ x: 0, y: 0, scale: 1 }}
                animate={{ x: b.x, y: b.y, scale: b.scale }}
                transition={{
                  duration: b.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: b.delay,
                }}
              />
            ))}
          </div>

          {/* Glass veil: blur + tint so blobs read as depth behind copy */}
          <div className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] bg-slate-950/35 backdrop-blur-md" />

          {/* Soft vignette + extra blue lift */}
          <div
            className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 85% 65% at 30% 25%, rgba(59,130,246,0.2), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 75%, rgba(30,58,138,0.35), transparent 50%)",
            }}
          />
        </>
      )}
    </>
  );
}
