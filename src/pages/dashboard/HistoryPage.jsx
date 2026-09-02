import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  ChevronLeft,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ListPlus,
  Clock,
  Loader2,
  AlertCircle,
  ChefHat,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDatePt(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDateTimePt(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function estimateSavings(lists) {
  const total = lists.reduce((acc, list) => {
    const listTotal = (list.items || []).reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    return acc + listTotal * 0.15;
  }, 0);
  return Number(total.toFixed(2));
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState({ total: 0, groups: [] });

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/lists/history");
      setHistory({
        total: Number(data?.total || 0),
        groups: Array.isArray(data?.groups) ? data.groups : [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível carregar o histórico. Verifique sua conexão.");
      setHistory({ total: 0, groups: [] });
    } finally {
      setLoading(false);
    }
  }

  const allLists = useMemo(() =>
    history.groups.flatMap((g) => g.lists || []),
    [history.groups]
  );

  const totalEstimatedSavings = useMemo(() => estimateSavings(allLists), [allLists]);

  const monthStats = useMemo(() => {
    const byMonth = new Map();
    for (const list of allLists) {
      const d = list.createdAt ? new Date(list.createdAt) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, { mes: MONTH_NAMES[d.getMonth()], ano: d.getFullYear(), valor: 0, listCount: 0 });
      }
      const entry = byMonth.get(key);
      entry.listCount += 1;
      entry.valor += estimateSavings([list]);
    }
    return [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6)
      .map(([, entry]) => ({ ...entry, valor: Number(entry.valor.toFixed(2)) }));
  }, [allLists]);

  const trend = useMemo(() => {
    if (monthStats.length < 2) return "up";
    return monthStats[0].valor >= monthStats[1].valor ? "up" : "down";
  }, [monthStats]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans flex flex-col">
      <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-50 p-4 sm:p-6 border-b border-white shadow-sm flex items-center gap-3 sm:gap-4">
        <Link to="/dashboard" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
          <ChevronLeft size={20} strokeWidth={3} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
            Meu Histórico
          </h1>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="truncate">Relatório de listas e economia estimada</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          disabled={loading}
          className="shrink-0 h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Atualizar"}
        </Button>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6 sm:space-y-8 mt-2 flex-col flex-1">

        {error && (
          <div className="flex items-start gap-3 rounded-2xl bg-orange-50 border border-orange-200 p-4 text-sm font-semibold text-orange-900">
            <AlertCircle className="mt-0.5 shrink-0 text-orange-600" size={18} />
            <div className="flex-1">
              <p>{error}</p>
              <button onClick={loadHistory} className="underline text-orange-700 hover:text-orange-800 font-bold mt-1">
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-emerald-400 text-white overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <TrendingDown size={180} strokeWidth={2} />
            </div>

            <CardContent className="p-6 sm:p-8 relative z-10">
              <div className="flex items-center gap-2 bg-emerald-700/50 w-fit px-3 py-1 rounded-full shadow-inner mb-5 sm:mb-6">
                <Calendar size={14} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                  Período Total
                </span>
              </div>

              <p className="text-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
                Economia Estimada
              </p>
              <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter drop-shadow-md">
                R$ {totalEstimatedSavings.toFixed(2).replace(".", ",")}
              </h2>

              <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-50 text-sm font-medium">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold ${trend === "up" ? "bg-emerald-500/50" : "bg-amber-500/50"}`}>
                    {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {trend === "up" ? "Boa tendência" : "Queda vs último mês"}
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={15} />
                    <strong className="font-black text-base">{history.total}</strong> lista(s) criadas
                  </span>
                </div>
                <Link to="/dashboard/lists" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black">
                    <ListPlus size={16} className="mr-1" /> Ver minhas listas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100 fill-mode-both">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">
                Resumo Mensal
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              *Estimativa 15% sobre preços
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white/60 rounded-[2rem] border border-slate-200/70 text-center">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
              <h3 className="text-base font-black text-slate-700">Carregando histórico...</h3>
            </div>
          ) : monthStats.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/60">
              <CardContent className="p-8 sm:p-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">Sem listas ainda</h3>
                <p className="text-slate-400 font-medium text-xs max-w-sm mx-auto">
                  Quando você criar listas de compras, o histórico e a economia aparecerão aqui mês a mês.
                </p>
                <Link to="/dashboard/lists" className="inline-block mt-5">
                  <Button className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg">
                    Criar primeira lista
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {monthStats.map((m, i) => (
                <Card key={`${m.ano}-${m.mes}-${i}`} className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[1.5rem] sm:rounded-[2rem] bg-white overflow-hidden">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-50 rounded-[0.9rem] sm:rounded-[1rem] flex items-center justify-center text-slate-400 font-black text-lg sm:text-xl italic border border-slate-100/50 shrink-0">
                        {m.mes.substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-slate-700 text-sm sm:text-base block truncate">
                          {m.mes} de {m.ano}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {m.listCount} lista(s)
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-emerald-600 text-lg sm:text-xl tracking-tighter">
                        R$ {m.valor.toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400 mt-1">
                        Economia estimada
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {!loading && history.groups.length > 0 && (
          <section className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-500 delay-200 fill-mode-both">
            <div className="flex items-center gap-2.5 px-1">
              <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">
                Linha do Tempo das Listas
              </h3>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {history.groups.map((group, gIdx) => (
                <div key={group.date || gIdx} className="relative pl-5 sm:pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-orange-300 via-orange-200 to-transparent" />
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 ring-4 ring-white shadow -translate-x-1/2" />

                  <div className="mb-3 sm:mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5">
                      <Calendar size={13} /> {formatDatePt(group.date)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {(group.lists || []).length} lista(s) neste dia
                    </p>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    {(group.lists || []).map((list) => (
                      <Link
                        key={String(list.id ?? list._id)}
                        to={`/dashboard/lists/${list.id ?? list._id}`}
                        className="block group"
                      >
                        <Card className="border border-slate-100 rounded-[1.5rem] bg-white transition-all group-hover:border-orange-200 group-hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] overflow-hidden">
                          <CardContent className="p-4 sm:p-4.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <h4 className="font-black text-slate-800 text-sm sm:text-base truncate">
                                    {list.name}
                                  </h4>
                                  {list.source === "recipe" && (
                                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                      <ChefHat size={11} /> Receita
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 text-[11px] sm:text-xs font-semibold text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <ShoppingBag size={12} />
                                    {(list.items || []).length} ite(ns)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDateTimePt(list.createdAt)}
                                  </span>
                                  {Number(list.budget) > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Wallet size={12} />
                                      Orçamento R$ {Number(list.budget).toFixed(2).replace(".", ",")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowUpRight size={17} className="text-slate-300 group-hover:text-orange-500 transition-colors shrink-0 mt-1" />
                            </div>

                            {(list.items || []).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                                {(list.items || []).slice(0, 4).map((item, iIdx) => (
                                  <span key={String(item.id ?? item._id ?? iIdx)} className="inline-block text-[10px] font-semibold bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-lg truncate max-w-[140px]">
                                    {item.quantity > 1 && `${item.quantity}× `}{item.name}
                                  </span>
                                ))}
                                {(list.items || []).length > 4 && (
                                  <span className="inline-block text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">
                                    +{(list.items || []).length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center pt-4 sm:pt-8">
          <p className="text-xs font-bold text-slate-400 px-4 sm:px-8 uppercase tracking-widest leading-relaxed">
            A inteligência contínua compara seus itens nos mercados parceiros e calcula a economia estimada!
          </p>
        </div>

      </main>
    </div>
  );
}

