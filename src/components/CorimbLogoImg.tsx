import { CORIMB_LOGO_SRC } from "@/lib/brand";

const defaultClassName = "h-9 w-9 shrink-0 object-contain";

type CorimbLogoImgProps = {
  /** Appended to the default size classes (36×36, `h-9 w-9`). */
  className?: string;
};

export function CorimbLogoImg({ className }: CorimbLogoImgProps) {
  const merged = className ? `${defaultClassName} ${className}` : defaultClassName;
  return (
    <img
      src={CORIMB_LOGO_SRC}
      alt=""
      width={36}
      height={36}
      className={merged}
      aria-hidden
    />
  );
}
