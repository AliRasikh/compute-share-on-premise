"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  initials = "D",
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
  const isAdmin = pathname?.startsWith("/admin");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem("auth-user");
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header
      className={`sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur md:px-6 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isAdmin ? "/admin" : pathname?.startsWith("/dashboard") ? "/dashboard" : "/"}
          className="flex min-w-0 flex-1 items-center gap-3 no-underline"
        >
          <CorimbLogoImg />
          <div className="min-w-0">
            {eyebrowText !== null ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                {eyebrowText}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          </div>
        </Link>

        {showNavigation || showProfileButton ? (
          <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
            {showNavigation ? (
              <nav className="flex items-center gap-4 sm:gap-6" aria-label="Workspace">
                {isAdmin ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 no-underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Switch to User Account
                  </Link>
                ) : (
                  <>
                    <Link
                      href={dashboardHref}
                      className={
                        pathname === dashboardHref || pathname === "/"
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
                  </>
                )}
              </nav>
            ) : null}

            {showProfileButton ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-blue-600 text-left shadow-sm transition hover:border-slate-300 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  aria-label="Profile menu"
                  title="Profile menu"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                      {initials}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">demo</p>
                    </div>
                    {pathname?.startsWith("/admin") ? (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors no-underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        User Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors no-underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
