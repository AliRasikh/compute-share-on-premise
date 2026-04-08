"use client";

import {
  WORKSPACE_SIDEBAR_DOM_ID,
  WorkspaceSidebarMenuButton,
} from "@/components/WorkspaceSidebar";
import { CORIMB_LOGO_SRC } from "@/lib/brand";

type HeaderNavToggleProps = {
  expanded: boolean;
  onOpen: () => void;
  /** Must match the mobile drawer `id` on `WorkspaceSidebar` */
  controlsId?: string;
};

type HeaderProps = {
  /**
   * Upper label. Omit for default "Company Workspace".
   * Pass `null` to hide the eyebrow line.
   */
  eyebrow?: string | null;
  /** Main heading (h1). Default: "Corimb". */
  title?: string;
  initials?: string;
  profileButtonLabel?: string;
  showProfileButton?: boolean;
  onManageProfileClick?: () => void;
  /** When set, shows the workspace menu button (hidden from `xl` up). */
  navToggle?: HeaderNavToggleProps;
  className?: string;
};

const DEFAULT_EYEBROW = "Company Workspace";
const DEFAULT_TITLE = "Corimb";

export function Header({
  eyebrow,
  title = DEFAULT_TITLE,
  initials = "CO",
  profileButtonLabel = "Manage Profile",
  showProfileButton = true,
  onManageProfileClick,
  navToggle,
  className,
}: HeaderProps) {
  const eyebrowText = eyebrow === undefined ? DEFAULT_EYEBROW : eyebrow;
  const controlsId = navToggle?.controlsId ?? WORKSPACE_SIDEBAR_DOM_ID;

  return (
    <header
      className={`sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur md:px-6 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {navToggle ? (
            <WorkspaceSidebarMenuButton
              mobileOpen={navToggle.expanded}
              onOpen={navToggle.onOpen}
              controlsId={controlsId}
            />
          ) : null}
          <img
            src={CORIMB_LOGO_SRC}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            aria-hidden
          />
          <div className="min-w-0">
            {eyebrowText !== null ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                {eyebrowText}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          </div>
        </div>
        {showProfileButton ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onManageProfileClick}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              aria-label="Manage profile"
              title="Manage profile"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                {initials}
              </span>
              {profileButtonLabel}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
