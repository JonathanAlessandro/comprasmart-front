import React, { useState } from "react";
import { Check, CircleAlert, ChevronDown, ChevronUp, Loader2, Sparkles, Store, TrendingDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export default function MarketComparisonModal({
  isOpen,
  comparison,
  loading,
  error,
  selectedMarkets,
  onToggleMarket,
  onConfirm,
  onClose,
}) {
  const [expandedMarket, setExpandedMarket] = useState(null);

  if (!isOpen) return null;

  const totals = comparison?.marketTotals || [];
  const availableMarkets = comparison?.availableMarkets || [];
  const userTotal = Number(comparison?.userTotal || 0);

  const toggleExpand = (source) => {
    setExpandedMarket((prev) => (prev === source ? null : source));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <Card className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 md:px-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={12} /> Comparador de Mercados
              </span>
            </div>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
              Onde comprar mais barato?
            </h2>
            <p className="mt-1 text-xs text-slate-300 font-medium">
              Comparando os preços da sua lista com os catálogos dos mercados parceiros.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar comparativo"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <CardContent className="space-y-6 overflow-y-auto p-6 md:p-8 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-blue-50 p-8 text-center text-sm font-bold text-blue-700">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-base font-black text-slate-800">Consultando catálogos de supermercados...</p>
              <p className="text-xs text-slate-500 font-medium">Buscando os menores preços atualizados no banco de dados.</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              <CircleAlert className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && comparison && (
            <>
              {/* Card Resumo do Preço Informado pelo Usuário */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Sua Lista (Preço Informado por Você)
                  </p>
                  <p className="text-xl font-black text-slate-800">
                    {userTotal > 0 ? formatCurrency(userTotal) : "R$ 0,00 (Sem valores preenchidos)"}
                  </p>
                </div>
                {comparison.cheapestMarket && comparison.cheapestMarket.total > 0 && userTotal > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-black">
                    <TrendingDown size={16} />
                    {userTotal >= comparison.cheapestMarket.total ? (
                      <span>Economia de até {formatCurrency(userTotal - comparison.cheapestMarket.total)} no {comparison.cheapestMarket.market}</span>
                    ) : (
                      <span>Menor valor encontrado: {formatCurrency(comparison.cheapestMarket.total)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Filtro de Mercados */}
              {availableMarkets.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Mercados no Comparativo
                    </h3>
                    <span className="text-xs font-bold text-slate-400">
                      {selectedMarkets.length} selecionado(s)
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {availableMarkets.map((market) => {
                      const selected = selectedMarkets.includes(market.source);
                      return (
                        <button
                          key={market.source}
                          type="button"
                          onClick={() => onToggleMarket(market.source)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-900 font-black shadow-sm"
                              : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 font-medium"
                          }`}
                        >
                          <span className="truncate">{market.market}</span>
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-transparent"}`}>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resultados por Mercado */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Preços e Economia por Supermercado (Somente Leitura)
                </h3>
                {totals.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    Nenhum produto correspondente foi encontrado nos mercados selecionados.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {totals.map((market, index) => {
                      const isCheapest = index === 0;
                      const isExpanded = expandedMarket === market.source;
                      const hasSavings = userTotal > 0 && userTotal > market.total;

                      return (
                        <div
                          key={market.source}
                          className={`rounded-2xl border transition-all ${
                            isCheapest
                              ? "border-emerald-400 bg-gradient-to-br from-emerald-50/80 to-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/50"
                              : "border-slate-200 bg-white shadow-sm"
                          }`}
                        >
                          <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`rounded-xl p-2.5 ${
                                    isCheapest ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <Store size={22} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 text-base">{market.market}</p>
                                    {isCheapest && (
                                      <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                        🏆 Mais Barato
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                    {market.matchedItems} de {market.matchedItems + market.missingItems} produtos encontrados
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-end sm:items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <p className="text-2xl font-black text-slate-900">{formatCurrency(market.total)}</p>
                                  {hasSavings && (
                                    <p className="text-[11px] font-black text-emerald-600">
                                      - {formatCurrency(userTotal - market.total)} vs seu preço
                                    </p>
                                  )}
                                  {!hasSavings && userTotal > 0 && market.total > userTotal && (
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      + {formatCurrency(market.total - userTotal)} vs seu preço
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleExpand(market.source)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                  aria-label="Ver itens deste mercado"
                                >
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                              </div>
                            </div>

                            {/* Barra de Cobertura */}
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    market.complete ? "bg-emerald-500" : "bg-amber-400"
                                  }`}
                                  style={{ width: `${market.coverage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 min-w-10 text-right">
                                {market.coverage}%
                              </span>
                            </div>
                          </div>

                          {/* Lista detalhada expandida de produtos no mercado (somente leitura) */}
                          {isExpanded && market.items && market.items.length > 0 && (
                            <div className="border-t border-slate-100 bg-slate-50/70 p-4 rounded-b-2xl space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                Produtos cotados neste supermercado:
                              </p>
                              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                                {market.items.map((it, idx) => (
                                  <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate">
                                        {it.productName || it.listName}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        Qtd: {it.quantity}x
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      {it.available && it.subtotal !== null ? (
                                        <>
                                          <p className="font-black text-slate-900">{formatCurrency(it.subtotal)}</p>
                                          <p className="text-[10px] text-slate-400">
                                            {formatCurrency(it.unitPrice)} un.
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                          Indisponível
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl font-black text-slate-600"
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading || !comparison || availableMarkets.length === 0}
              className="h-12 rounded-xl bg-blue-600 px-6 font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Consultando..." : "Atualizar Comparação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
