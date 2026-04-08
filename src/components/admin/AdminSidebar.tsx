"use client";

import { useEffect } from "react";
import { SidebarToggleIcon } from "@/components/SidebarToggleIcon";

const NAV_ITEMS = ["Overview", "Cluster", "Demand", "Health", "Activity"] as const;

const SIDEBAR_SHELL =
  "flex flex-col overflow-hidden border-r border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5";

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="shrink-0 rounded-xl border border-blue-300/20 bg-blue-500/10 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Compute Exchange</p>
        <p className="mt-1 text-lg font-semibold text-white">Admin Console</p>
      </div>
      <nav className="mt-6 shrink-0 space-y-2 text-sm" aria-label="Admin sections">
        {NAV_ITEMS.map((item, idx) => (
          <button
            key={item}
            type="button"
            className={`w-full rounded-lg px-3 py-2 text-left transition ${
              idx === 0
                ? "bg-blue-500/20 text-blue-100"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
            onClick={onNavigate}
          >
            {item}
          </button>
        ))}
      </nav>
    </>
  );
}

export function AdminSidebarToggleButton({
  mobileOpen,
  onOpen,
}: {
  mobileOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100/90 lg:hidden"
      onClick={onOpen}
      aria-expanded={mobileOpen}
      aria-controls="admin-mobile-sidebar"
      aria-label="Open navigation"
    >
      <SidebarToggleIcon className="h-5 w-5" />
    </button>
  );
}

export function AdminSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const close = () => onMobileOpenChange(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
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

  return (
    <div className="relative min-h-0 w-full min-w-0 lg:min-h-screen">
      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            role="presentation"
            onClick={close}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(280px,88vw)] shadow-xl lg:hidden ${SIDEBAR_SHELL}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-sidebar-title"
            id="admin-mobile-sidebar"
          >
            <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
              <span id="admin-mobile-sidebar-title" className="text-xs font-medium text-slate-400">
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
            <AdminSidebarNav onNavigate={close} />
          </aside>
        </>
      ) : null}

      <aside
        className={`hidden min-h-0 lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-screen lg:max-h-screen lg:shrink-0 lg:self-start ${SIDEBAR_SHELL}`}
      >
        <AdminSidebarNav />
      </aside>
    </div>
  );
}
