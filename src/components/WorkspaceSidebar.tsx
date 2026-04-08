"use client";

import { useEffect } from "react";
import { SidebarToggleIcon } from "@/components/SidebarToggleIcon";

export const WORKSPACE_SIDEBAR_DOM_ID = "workspace-sidebar";

export type WorkspaceSidebarNavItem = {
  id: string;
  label: string;
};

export const DEFAULT_WORKSPACE_SIDEBAR_ITEMS: WorkspaceSidebarNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "add-job", label: "Add Job" },
  { id: "billing", label: "Billing" },
  { id: "settings", label: "Settings" },
];

const SIDEBAR_SHELL =
  "flex flex-col overflow-hidden border-r border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5";

type WorkspaceSidebarNavProps = {
  brandEyebrow: string;
  brandTitle: string;
  items: WorkspaceSidebarNavItem[];
  activeItemId?: string;
  onItemSelect?: (item: WorkspaceSidebarNavItem) => void;
  onNavigate?: () => void;
};

function WorkspaceSidebarNav({
  brandEyebrow,
  brandTitle,
  items,
  activeItemId = "add-job",
  onItemSelect,
  onNavigate,
}: WorkspaceSidebarNavProps) {
  return (
    <>
      <div className="shrink-0 rounded-xl border border-blue-300/20 bg-blue-500/10 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-200">{brandEyebrow}</p>
        <p className="mt-1 text-lg font-semibold text-white">{brandTitle}</p>
      </div>
      <nav className="mt-6 shrink-0 space-y-2 text-sm" aria-label="Workspace sections">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`w-full rounded-lg px-3 py-2 text-left transition ${
              item.id === activeItemId
                ? "bg-blue-500/20 text-blue-100"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
            onClick={() => {
              onItemSelect?.(item);
              onNavigate?.();
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export function WorkspaceSidebarMenuButton({
  mobileOpen,
  onOpen,
  controlsId = WORKSPACE_SIDEBAR_DOM_ID,
}: {
  mobileOpen: boolean;
  onOpen: () => void;
  controlsId?: string;
}) {
  return (
    <button
      type="button"
      className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100/90 xl:hidden"
      onClick={onOpen}
      aria-expanded={mobileOpen}
      aria-controls={controlsId}
      aria-label="Open navigation"
    >
      <SidebarToggleIcon className="h-5 w-5" />
    </button>
  );
}

type WorkspaceSidebarProps = {
  /** DOM id for aria-controls from the menu button */
  id?: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  brandEyebrow?: string;
  brandTitle?: string;
  items?: WorkspaceSidebarNavItem[];
  activeItemId?: string;
  onItemSelect?: (item: WorkspaceSidebarNavItem) => void;
};

export function WorkspaceSidebar({
  id = WORKSPACE_SIDEBAR_DOM_ID,
  mobileOpen,
  onMobileOpenChange,
  brandEyebrow = "Compute Exchange",
  brandTitle = "Company Console",
  items = DEFAULT_WORKSPACE_SIDEBAR_ITEMS,
  activeItemId = "add-job",
  onItemSelect,
}: WorkspaceSidebarProps) {
  const close = () => onMobileOpenChange(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const closeIfDesktop = () => {
      if (mq.matches) onMobileOpenChange(false);
    };
    mq.addEventListener("change", closeIfDesktop);
    return () => mq.removeEventListener("change", closeIfDesktop);
  }, [onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navProps = {
    brandEyebrow,
    brandTitle,
    items,
    activeItemId,
    onItemSelect,
  };

  return (
    <div className="relative min-h-0 w-full min-w-0 xl:min-h-screen">
      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm xl:hidden"
            role="presentation"
            onClick={close}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(280px,88vw)] shadow-xl xl:hidden ${SIDEBAR_SHELL}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            id={id}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
              <span id={`${id}-title`} className="text-xs font-medium text-slate-400">
                Menu
              </span>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                onClick={close}
                aria-label="Close navigation"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <WorkspaceSidebarNav {...navProps} onNavigate={close} />
          </aside>
        </>
      ) : null}

      <aside
        className={`hidden min-h-0 xl:sticky xl:top-0 xl:z-10 xl:flex xl:h-screen xl:max-h-screen xl:w-full xl:max-w-[240px] xl:shrink-0 xl:self-start ${SIDEBAR_SHELL}`}
        aria-label="Workspace navigation"
      >
        <WorkspaceSidebarNav {...navProps} />
      </aside>
    </div>
  );
}
