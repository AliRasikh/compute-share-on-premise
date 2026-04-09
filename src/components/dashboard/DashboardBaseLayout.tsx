"use client";

import { usePathname } from "next/navigation";
import { BaseLayout } from "@/components/BaseLayout";

export function DashboardBaseLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();

  const isCompute = pathname.startsWith("/dashboard/compute");
  const headerTitle = isCompute ? "Compute Engine" : "Network Dashboard";

  return (
    <BaseLayout
      className={className}
      headerEyebrow="Global Cluster Overview • Live Telemetry"
      headerTitle={headerTitle}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      {children}
    </BaseLayout>
  );
}
