"use client";

import { useEffect } from "react";
import {
  type SideBarListItem,
  SideBarButton,
} from "@/components/SideBarButton";

export type { SideBarListItem } from "@/components/SideBarButton";
import { SidebarToggleIcon } from "@/components/SidebarToggleIcon";

export const WORKSPACE_SIDEBAR_DOM_ID = "workspace-sidebar";

/** @deprecated Use `SideBarListItem` from `@/components/SideBarButton` */
export type WorkspaceSidebarNavItem = SideBarListItem;

export const DEFAULT_WORKSPACE_SIDEBAR_ITEMS: SideBarListItem[] = [
  { id: "overview", buttonText: "Overview", buttonAction: () => {} },
  { id: "add-job", buttonText: "Add Job", buttonAction: () => {} },
  { id: "billing", buttonText: "Billing", buttonAction: () => {} },
  { id: "settings", buttonText: "Settings", buttonAction: () => {} },
];

const SIDEBAR_SHELL =
  "flex flex-col overflow-hidden border-r border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5";

type WorkspaceSidebarNavProps = {
  brandEyebrow: string;
  brandTitle: string;
  items: SideBarListItem[];
  activeItemId?: string;
  onItemSelect?: (item: SideBarListItem) => void;
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
      <nav className="mt-6 flex shrink-0 flex-col space-y-2" aria-label="Workspace sections">
        {items.map((item) => (
          <SideBarButton
            key={item.id}
            buttonText={item.buttonText}
            isActive={item.id === activeItemId}
            buttonAction={() => {
              item.buttonAction();
              onItemSelect?.(item);
              onNavigate?.();
            }}
          />
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
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 xl:hidden"
      onClick={onOpen}
      aria-expanded={mobileOpen}
      aria-controls={controlsId}
      aria-label="Open navigation"
    >
      <SidebarToggleIcon className="h-6 w-6" />
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
  items?: SideBarListItem[];
  activeItemId?: string;
  onItemSelect?: (item: SideBarListItem) => void;
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
