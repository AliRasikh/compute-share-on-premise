"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CorimbLogoImg } from "@/components/CorimbLogoImg";

const navTextClass =
  "text-sm font-medium text-slate-600 transition hover:text-slate-900";
const activeNavTextClass =
  "text-sm font-semibold text-slate-900 transition";

type HeaderProps = {
  /**
   * Upper label. Omit for default "Company Workspace".
   * Pass `null` to hide the eyebrow line.
   */
  eyebrow?: string | null;
  /** Main heading (h1). Default: "Corimb". */
  title?: string;
  initials?: string;
  /** Optional profile image URL; falls back to initials on a colored circle. */
  avatarSrc?: string;
  /** Primary app route for the Dashboard control. */
  dashboardHref?: string;
  /** Used when `onNewTaskClick` is not set. */
  newTaskHref?: string;
  /** When set, "New Task" renders as a button instead of a link. */
  onNewTaskClick?: () => void;
  showProfileButton?: boolean;
  /** When false, workspace nav links (Dashboard, My Nodes, New Task) are hidden. */
  showNavigation?: boolean;
  onManageProfileClick?: () => void;
  className?: string;
};

const DEFAULT_EYEBROW = "Company Workspace";
const DEFAULT_TITLE = "Corimb";

export function Header({
  eyebrow,
  title = DEFAULT_TITLE,
  initials = "CO",
  avatarSrc,
  dashboardHref = "/dashboard",
  newTaskHref = "/dashboard/compute",
  onNewTaskClick,
  showProfileButton = true,
  showNavigation = true,
  onManageProfileClick,
  className,
}: HeaderProps) {
  const eyebrowText = eyebrow === undefined ? DEFAULT_EYEBROW : eyebrow;
  const pathname = usePathname();

  return (
    <header
      className={`sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur md:px-6 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CorimbLogoImg />
          <div className="min-w-0">
            {eyebrowText !== null ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                {eyebrowText}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          </div>
        </div>

        {showNavigation || showProfileButton ? (
          <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
            {showNavigation ? (
              <nav className="flex items-center gap-4 sm:gap-6" aria-label="Workspace">
                <Link
                  href={dashboardHref}
                  className={
                    pathname === dashboardHref || pathname === "/admin" || pathname === "/"
                      ? activeNavTextClass
                      : navTextClass
                  }
                >
                  Dashboard
                </Link>
                <Link href="/dashboard/my-nodes" className={navTextClass}>
                  My Nodes
                </Link>
                {onNewTaskClick ? (
                  <button
                    type="button"
                    onClick={onNewTaskClick}
                    className={`${navTextClass} cursor-pointer border-0 bg-transparent p-0 font-sans`}
                  >
                    New Task
                  </button>
                ) : (
                  <Link href={newTaskHref} className={navTextClass}>
                    New Task
                  </Link>
                )}
              </nav>
            ) : null}

            {showProfileButton ? (
              <button
                type="button"
                onClick={onManageProfileClick}
                className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-blue-600 text-left shadow-sm transition hover:border-slate-300 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Manage profile"
                title="Manage profile"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                    {initials}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
