export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 py-2.5 text-center text-[11px] text-slate-500">
      <p className="font-medium tracking-wide text-slate-600">
        © {new Date().getFullYear()} Corimb
      </p>
      <p className="text-slate-400 mt-0.5">🇪🇺 Proudly hosted in the EU</p>
    </footer>
  );
}
