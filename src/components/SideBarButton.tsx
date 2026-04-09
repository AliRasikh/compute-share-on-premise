import Link from "next/link";

export type SideBarListItem = {
  id: string;
  buttonText: string;
  href: string;
  icon?: React.ReactNode;
};

type SideBarButtonProps = {
  buttonText: string;
  href: string;
  icon?: React.ReactNode;
  /** Used by sidebar lists to show the active entry */
  isActive?: boolean;
  onClick?: () => void;
};

export function SideBarButton({ buttonText, href, icon, isActive = false, onClick }: SideBarButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors overflow-hidden whitespace-nowrap ${
        isActive
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
      onClick={onClick}
      title={buttonText}
    >
      {icon && <div className="shrink-0 flex items-center justify-center w-6 h-6">{icon}</div>}
      <span className="opacity-0 w-0 transition-all duration-300 xl:group-hover:opacity-100 xl:group-hover:w-auto xl:hidden xl:group-hover:block" style={{ display: 'inline-block' }}>{buttonText}</span>
      <span className="xl:hidden">{buttonText}</span>
    </Link>
  );
}
