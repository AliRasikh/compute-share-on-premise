export type SideBarListItem = {
  id: string;
  buttonText: string;
  /** Any side effect: route change, modal, state update, etc. */
  buttonAction: () => void;
};

type SideBarButtonProps = {
  buttonText: string;
  buttonAction: () => void;
  /** Used by sidebar lists to show the active entry */
  isActive?: boolean;
};

export function SideBarButton({ buttonText, buttonAction, isActive = false }: SideBarButtonProps) {
  return (
    <button
      type="button"
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
        isActive
          ? "bg-blue-500/20 text-blue-100"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
      onClick={buttonAction}
    >
      {buttonText}
    </button>
  );
}
