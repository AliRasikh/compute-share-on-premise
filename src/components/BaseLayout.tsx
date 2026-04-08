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
  /** Extra classes on the outer wrapper (e.g. background) */
  className?: string;
};

/**
 * App shell: shared Header + scrollable main + shared Footer (`@/components/Header`, `@/components/Footer`).
 * Place as a direct child of `body` (use `className="flex-1 flex min-h-0 flex-col"` on the wrapper if the body is a flex column).
 */
export function BaseLayout({
  children,
  headerEyebrow,
  headerTitle,
  headerShowProfileButton,
  mainClassName,
  className,
}: BaseLayoutProps) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-slate-100 ${className ?? ""}`}>
      <Header
        eyebrow={headerEyebrow}
        title={headerTitle}
        showProfileButton={headerShowProfileButton}
      />
      <main className={`min-h-0 flex-1 overflow-auto ${mainClassName ?? ""}`}>{children}</main>
      <Footer />
    </div>
  );
}
