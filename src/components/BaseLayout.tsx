"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

type BaseLayoutProps = {
  children: React.ReactNode;
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
};

/**
 * App shell: `Header` + scrollable `main` + `Footer`.
 * (`WorkspaceSidebar` remains available as a standalone component when needed.)
 */
export function BaseLayout({
  children,
  headerEyebrow,
  headerTitle,
  headerShowProfileButton,
  mainClassName,
  className,
}: BaseLayoutProps) {
  const header = (
    <Header
      eyebrow={headerEyebrow}
      title={headerTitle}
      showProfileButton={headerShowProfileButton}
    />
  );

  const main = (
    <main className={`min-h-0 flex-1 overflow-auto ${mainClassName ?? ""}`}>{children}</main>
  );

  const footer = <Footer />;

  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-slate-100 ${className ?? ""}`}>
      {header}
      {main}
      {footer}
    </div>
  );
}
