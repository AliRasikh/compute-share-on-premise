/** Shared motion paths / timing for hero and light poster blob fields */

export type BlobLayout = {
  id: number;
  size: number;
  left: string;
  top: string;
  x: number[];
  y: number[];
  duration: number;
  delay: number;
  scale: number[];
};

/** vs original ~20s loops: 3× then 2× → divide by 6 */
export const BLOB_TIME_DIV = 6;

/** 10% less than 56px */
export const BLOB_BLUR_PX = 56 * 0.9;

export const BLOB_LAYOUTS: BlobLayout[] = [
  {
    id: 0,
    size: 320,
    left: "8%",
    top: "12%",
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
    x: [0, 20, -32, 14, 0],
    y: [0, 40, -18, 22, 0],
    duration: 21 / BLOB_TIME_DIV,
    delay: 1.6 / BLOB_TIME_DIV,
    scale: [1, 0.95, 1.06, 1, 1],
  },
];

export const HERO_BLOB_BACKGROUNDS = [
  "rgba(59, 130, 246, 0.42)",
  "rgba(99, 102, 241, 0.38)",
  "rgba(14, 165, 233, 0.35)",
  "rgba(129, 140, 248, 0.32)",
  "rgba(56, 189, 248, 0.28)",
  "rgba(147, 197, 253, 0.3)",
] as const;

/**
 * Light poster: stronger sky/cyan/blue blobs so motion reads on pale UI (still on-brand cool tones)
 */
export const LIGHT_POSTER_BLOB_BACKGROUNDS = [
  "rgba(14, 165, 233, 0.42)",
  "rgba(59, 130, 246, 0.38)",
  "rgba(56, 189, 248, 0.36)",
  "rgba(34, 211, 238, 0.34)",
  "rgba(125, 211, 252, 0.48)",
  "rgba(99, 102, 241, 0.26)",
] as const;

/** Extra “life” for light poster only (hero unchanged); duration matches hero */
export const LIGHT_POSTER_MOTION = {
  /** Wider drift paths */
  xyMultiplier: 1.3,
  /** Slightly stronger breathe on scale keyframes */
  scaleExaggeration: 1.12,
  /** Slightly sharper blobs than hero so edges track better */
  blurMultiplier: 0.82,
} as const;
