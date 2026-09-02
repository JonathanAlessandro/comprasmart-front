import React, { useMemo } from "react";
import { AlertTriangle, ShieldAlert, FlaskConical, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function sourceBadge(source) {
  switch (source) {
    case "anvisa":
      return { label: "ANVISA", icon: FlaskConical, className: "bg-violet-50 text-violet-700 border-violet-200" };
    case "openfoodfacts":
      return { label: "Open Food Facts", icon: Package, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "keywords":
    default:
      return { label: "Nome do produto", icon: ShieldAlert, className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}

export default function AllergenWarningPopup({
  open,
  loading,
  matches,
  onConfirm,
  onCancel,
  confirmLabel = "Estou ciente, continuar",
  cancelLabel = "Cancelar",
  sourceLabel,
}) {
  const byAllergy = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(matches)) return map;
    for (const m of matches) {
      for (const allergy of m.matches || []) {
        if (!map.has(allergy)) map.set(allergy, []);
        map.get(allergy).push(m);
      }
    }
    return map;
  }, [matches]);

  if (!open) return null;
  const totalAlergias = byAllergy.size;
  const totalItens = (matches || []).length;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <Card className="w-full max-w-xl rounded-3xl border-none bg-white shadow-2xl">
        <div className="px-7 pt-7">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner">
                <AlertTriangle size={30} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Atenção — risco alérgico</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {sourceLabel ? `${sourceLabel} — ` : ""}
                  {totalAlergias === 1
                    ? `Foi encontrada ${totalAlergias} alergia registrada em ${totalItens} item(ns).`
                    : `Foram encontradas ${totalAlergias} alergias registradas em ${totalItens} item(ns).`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl p-2 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fechar aviso"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-7 py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              <div className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
              Verificando alergênicos nas bases Open Food Facts e ANVISA...
            </div>
          ) : byAllergy.size === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
              Nenhum alergênico das suas restrições foi detectado.
            </div>
          ) : (
            <div className="space-y-4 max-h-[320px] overflow-auto pr-1">
              {Array.from(byAllergy.entries()).map(([allergy, items]) => (
                <div key={allergy} className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-red-600 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                      Alergia: {allergy}
                    </span>
                    {Array.from(
                      new Set(
                        items.flatMap((it) =>
                          (it.sources || []).map((s) => (sourceBadge(s).label)),
                        ),
                      ),
                    ).map((s) => {
                      const meta = sourceBadge(s.toLowerCase());
                      const Icon = meta.icon;
                      return (
                        <span
                          key={s}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${meta.className}`}
                        >
                          <Icon size={11} />
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-800">{item.name}</p>
                          <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            Detecções: {(item.matches || []).join(" · ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2 rounded-b-3xl border-t border-slate-100 bg-slate-50 p-5 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="h-12 rounded-2xl font-black text-slate-500 hover:bg-white"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading || (matches && matches.length > 0 && totalAlergias === 0)}
            className="h-12 rounded-2xl bg-red-600 font-black text-white hover:bg-red-700 disabled:opacity-60"
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
