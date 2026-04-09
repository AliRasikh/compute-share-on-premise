"use client";

import type { ReactNode } from "react";
import { AnimatedBlobField } from "@/components/home/AnimatedBlobField";

type AuthMainBackdropProps = {
  children: ReactNode;
};

export function AuthMainBackdrop({ children }: AuthMainBackdropProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatedBlobField variant="hero" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10 md:px-6">
        <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
