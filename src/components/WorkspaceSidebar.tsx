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
  { id: "overview", buttonText: "Overview", href: "/dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { id: "compute-engine", buttonText: "Compute", href: "/dashboard/compute", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg> },
  { id: "settings", buttonText: "Settings", href: "/settings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
];

const SIDEBAR_SHELL_DESKTOP =
  "group hidden xl:flex xl:flex-col overflow-hidden border-r border-slate-200 bg-white py-4 w-16 hover:w-64 transition-[width] duration-300 shrink-0";
const SIDEBAR_SHELL_MOBILE =
  "flex flex-col overflow-hidden border-r border-slate-200 bg-white p-4";

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
      <div className="shrink-0 px-3 pb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="opacity-0 w-0 transition-all duration-300 xl:group-hover:opacity-100 xl:group-hover:w-auto xl:hidden xl:group-hover:block whitespace-nowrap">
          <h2 className="text-lg font-bold text-slate-900">{brandTitle}</h2>
          {brandEyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {brandEyebrow}
            </p>
          )}
        </div>
        <div className="xl:hidden whitespace-nowrap">
          <h2 className="text-lg font-bold text-slate-900">{brandTitle}</h2>
          {brandEyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {brandEyebrow}
            </p>
          )}
        </div>
      </div>
      <nav className="mt-6 flex shrink-0 flex-col space-y-2" aria-label="Workspace sections">
        {items.map((item) => (
          <SideBarButton
            key={item.id}
            buttonText={item.buttonText}
            href={item.href}
            icon={item.icon}
            isActive={item.id === activeItemId}
            onClick={() => {
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
  onToggle,
  controlsId = WORKSPACE_SIDEBAR_DOM_ID,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
  controlsId?: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex xl:hidden shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      onClick={onToggle}
      aria-expanded={mobileOpen}
      aria-controls={controlsId}
      aria-label="Toggle navigation"
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
  desktopOpen?: boolean;
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
  desktopOpen = true,
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
    <div className={`relative min-h-0 ${desktopOpen ? "xl:min-h-screen" : "xl:hidden"}`}>
      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm xl:hidden"
            role="presentation"
            onClick={close}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(280px,88vw)] shadow-xl xl:hidden ${SIDEBAR_SHELL_MOBILE}`}
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

      {desktopOpen ? (
        <aside
          className={`hidden min-h-0 xl:sticky xl:top-0 xl:z-10 xl:flex xl:h-screen xl:max-h-screen xl:self-start ${SIDEBAR_SHELL_DESKTOP}`}
          aria-label="Workspace navigation"
        >
          <WorkspaceSidebarNav {...navProps} />
        </aside>
      ) : null}
    </div>
  );
}
