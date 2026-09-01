import { BadgePercent, ShoppingBasket } from "lucide-react";

export function BrandLogo({ compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="PoupeCesta">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
        <ShoppingBasket size={22} strokeWidth={2.4} aria-hidden="true" />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-emerald-950 shadow-sm">
          <BadgePercent size={12} strokeWidth={3} aria-hidden="true" />
        </span>
      </span>
      {!compact && (
        <span className="text-xl font-black tracking-[-0.04em] text-slate-900">
          Poupe<span className="text-emerald-600">Cesta</span>
        </span>
      )}
    </span>
  );
}
