"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { type SideBarListItem, WorkspaceSidebar } from "@/components/WorkspaceSidebar";

type BaseLayoutProps = {
  children: React.ReactNode;
  /** When false, single-column shell without workspace sidebar or header menu button */
  showWorkspaceSidebar?: boolean;
  /** Optional override for the header eyebrow; pass `null` to hide */
  headerEyebrow?: string | null;
  /** Optional override for the main header title (h1) */
  headerTitle?: string;
  /** Hide the profile action in the header */
  headerShowProfileButton?: boolean;
  /** Extra classes on the scrollable main region */
  mainClassName?: string;
  /** Extra classes on the outer wrapper (e.g. min-h-screen) */
  className?: string;
  /** Workspace sidebar branding and nav (only when `showWorkspaceSidebar`) */
  sidebarBrandEyebrow?: string;
  sidebarBrandTitle?: string;
  sidebarItems?: SideBarListItem[];
  sidebarActiveItemId?: string;
  onSidebarItemSelect?: (item: SideBarListItem) => void;
  sidebarId?: string;
};

/**
 * App shell: optional `WorkspaceSidebar` + `Header` (with matching nav toggle) + scrollable `main` + `Footer`.
 */
export function BaseLayout({
  children,
  showWorkspaceSidebar = true,
  headerEyebrow,
  headerTitle,
  headerShowProfileButton,
  mainClassName,
  className,
  sidebarBrandEyebrow,
  sidebarBrandTitle,
  sidebarItems,
  sidebarActiveItemId,
  onSidebarItemSelect,
  sidebarId,
}: BaseLayoutProps) {
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false);

  const header = (
    <Header
      eyebrow={headerEyebrow}
      title={headerTitle}
      showProfileButton={headerShowProfileButton}
      navToggle={
        showWorkspaceSidebar
          ? {
              expanded: workspaceSidebarOpen,
              onOpen: () => setWorkspaceSidebarOpen(true),
            }
          : undefined
      }
    />
  );

  const main = (
    <main className={`min-h-0 flex-1 overflow-auto ${mainClassName ?? ""}`}>{children}</main>
  );

  const footer = <Footer />;

  if (!showWorkspaceSidebar) {
    return (
      <div className={`flex min-h-0 flex-1 flex-col bg-slate-100 ${className ?? ""}`}>
        {header}
        {main}
        {footer}
      </div>
    );
  }

  return (
    <div
      className={`grid min-h-0 flex-1 grid-cols-1 bg-slate-100 xl:grid-cols-[240px_1fr] ${className ?? ""}`}
    >
      <WorkspaceSidebar
        id={sidebarId}
        mobileOpen={workspaceSidebarOpen}
        onMobileOpenChange={setWorkspaceSidebarOpen}
        brandEyebrow={sidebarBrandEyebrow}
        brandTitle={sidebarBrandTitle}
        items={sidebarItems}
        activeItemId={sidebarActiveItemId}
        onItemSelect={onSidebarItemSelect}
      />
      <div className="flex min-h-0 flex-col">
        {header}
        {main}
        {footer}
      </div>
    </div>
  );
}
