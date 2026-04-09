"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BLOB_BLUR_PX,
  BLOB_LAYOUTS,
  HERO_BLOB_BACKGROUNDS,
  LIGHT_POSTER_BLOB_BACKGROUNDS,
  LIGHT_POSTER_MOTION,
} from "@/components/home/blobLayouts";

type BlobFieldVariant = "hero" | "lightPoster";

const VARIANT_STYLES: Record<
  BlobFieldVariant,
  {
    baseClass: string;
    reducedClass: string;
    reducedStyle: CSSProperties;
    veilClass: string;
    vignetteClass: string;
    vignetteStyle: CSSProperties;
    vignetteOpacity: string;
  }
> = {
  hero: {
    baseClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950",
    reducedClass: "opacity-45",
    reducedStyle: {
      backgroundImage:
        "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 60%, rgba(148,163,184,0.2), transparent 40%)",
    },
    veilClass: "bg-slate-950/35 backdrop-blur-md",
    vignetteClass: "",
    vignetteStyle: {
      backgroundImage:
        "radial-gradient(ellipse 85% 65% at 30% 25%, rgba(59,130,246,0.2), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 75%, rgba(30,58,138,0.35), transparent 50%)",
    },
    vignetteOpacity: "opacity-70",
  },
  lightPoster: {
    baseClass: "bg-gradient-to-br from-[#f0f4f8] via-sky-50 to-[#dbeafe]",
    reducedClass: "opacity-100",
    reducedStyle: {
      backgroundImage:
        "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.95) 0%, #e8f0f8 45%, #dbeafe 100%)",
    },
    veilClass: "bg-white/20 backdrop-blur-sm",
    vignetteClass: "",
    vignetteStyle: {
      backgroundImage:
        "radial-gradient(ellipse 88% 68% at 48% 38%, transparent 32%, rgba(56, 189, 248, 0.18) 100%), radial-gradient(ellipse 58% 48% at 88% 78%, rgba(59, 130, 246, 0.1), transparent 52%)",
    },
    vignetteOpacity: "opacity-80",
  },
};

type MergedBlob = (typeof BLOB_LAYOUTS)[number] & {
  background: string;
  blurPx: number;
};

function mergeBlobs(variant: BlobFieldVariant): MergedBlob[] {
  const colors =
    variant === "hero"
      ? HERO_BLOB_BACKGROUNDS
      : LIGHT_POSTER_BLOB_BACKGROUNDS;

  return BLOB_LAYOUTS.map((layout, i) => {
    const background = colors[i] ?? colors[colors.length - 1];
    if (variant === "hero") {
      return { ...layout, background, blurPx: BLOB_BLUR_PX };
    }
    const { xyMultiplier, scaleExaggeration, blurMultiplier } = LIGHT_POSTER_MOTION;
    return {
      ...layout,
      background,
      blurPx: BLOB_BLUR_PX * blurMultiplier,
      x: layout.x.map((v) => v * xyMultiplier),
      y: layout.y.map((v) => v * xyMultiplier),
      scale: layout.scale.map((s) => 1 + (s - 1) * scaleExaggeration),
    };
  });
}

type AnimatedBlobFieldProps = {
  variant: BlobFieldVariant;
};

export function AnimatedBlobField({ variant }: AnimatedBlobFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const styles = VARIANT_STYLES[variant];
  const blobs = mergeBlobs(variant);

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-[inherit] ${styles.baseClass}`}
      />

      {prefersReducedMotion ? (
        <div
          className={`pointer-events-none absolute inset-0 z-0 rounded-[inherit] ${styles.reducedClass}`}
          style={styles.reducedStyle}
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
            {blobs.map((b) => (
              <motion.div
                key={b.id}
                className="absolute rounded-full will-change-transform"
                style={{
                  width: b.size,
                  height: b.size,
                  left: b.left,
                  top: b.top,
                  background: b.background,
                  filter: `blur(${b.blurPx}px)`,
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

          <div
            className={`pointer-events-none absolute inset-0 z-1 rounded-[inherit] ${styles.veilClass}`}
          />

          <div
            className={`pointer-events-none absolute inset-0 z-2 rounded-[inherit] ${styles.vignetteOpacity} ${styles.vignetteClass}`}
            style={styles.vignetteStyle}
          />
        </>
      )}
    </>
  );
}
