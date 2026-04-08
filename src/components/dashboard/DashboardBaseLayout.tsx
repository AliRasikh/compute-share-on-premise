"use client";

import { usePathname, useRouter } from "next/navigation";
import { BaseLayout } from "@/components/BaseLayout";
import type { SideBarListItem } from "@/components/WorkspaceSidebar";

export function DashboardBaseLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarItems: SideBarListItem[] = [
    {
      id: "overview",
      buttonText: "Overview",
      href: "/dashboard",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
      id: "compute-engine",
      buttonText: "Compute",
      href: "/dashboard/compute",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
    },
    {
      id: "settings",
      buttonText: "Settings",
      href: "/settings",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    },
  ];

  const isCompute = pathname.startsWith("/dashboard/compute");
  const activeItemId = isCompute ? "compute-engine" : "overview";
  const headerTitle = isCompute ? "Compute Engine" : "Network Dashboard";

  return (
    <BaseLayout
      className={className}
      sidebarBrandEyebrow="Marketplace PRD"
      sidebarBrandTitle="Eco-Network"
      sidebarItems={sidebarItems}
      sidebarActiveItemId={activeItemId}
      headerEyebrow="Global Cluster Overview • Live Telemetry"
      headerTitle={headerTitle}
      mainClassName="p-4 sm:p-6 lg:p-8"
    >
      {children}
    </BaseLayout>
  );
}
