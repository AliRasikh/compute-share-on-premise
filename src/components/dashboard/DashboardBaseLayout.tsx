"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/BaseLayout";

export function DashboardBaseLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = sessionStorage.getItem("auth-user");
    if (!user) {
      router.replace("/login");
    } else {
      setAuthed(true);
    }
    setChecking(false);
  }, [router]);

  const isCompute = pathname.startsWith("/dashboard/compute");
  const isMyNodes = pathname.startsWith("/dashboard/my-nodes");
  const headerTitle = isCompute ? "New Task" : isMyNodes ? "Compute Engine" : "Network Dashboard";

  if (checking || !authed) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-slate-100 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

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
