import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  ListChecks,
  AlertTriangle,
  User,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLists } from "@/contexts/ListContext"; // Importando o contexto para criar a lista

const navItems = [
  { path: "/dashboard", label: "Home", Icon: HomeIcon },
  { path: "/dashboard/lists", label: "Listas", Icon: ListChecks },
  // Espaçador para o botão central
  { isSpacer: true },
  { path: "/dashboard/alerts", label: "Alertas", Icon: AlertTriangle },
  { path: "/dashboard/profile", label: "Perfil", Icon: User },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addList } = useLists();

  // Estados para o Modal Global de Nova Lista
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      const newList = await addList(name.trim(), budget);
      if (newList && newList._id) {
        setName("");
        setBudget("");
        setShowModal(false);
        navigate(`/dashboard/lists/${newList._id}`);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Não foi possível criar a lista. Verifique se o backend está ativo e se você está autenticado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLinkActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-2 pt-2 shadow-[0_-5px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:bottom-6 md:border-0 md:bg-transparent md:px-6 md:pt-0 md:shadow-none md:backdrop-blur-none"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <div className="relative mx-auto grid h-14 w-full max-w-md grid-cols-5 items-center md:h-16 md:max-w-xl md:rounded-[1.75rem] md:border md:border-slate-200/80 md:bg-white/95 md:px-3 md:shadow-[0_18px_50px_rgba(15,23,42,0.16)] md:backdrop-blur-xl">
        {navItems.map((item) => {
          if (item.isSpacer) {
            return <div key="spacer" aria-hidden="true" />;
          }

          const isActive = isLinkActive(item.path);
          const Icon = item.Icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`group flex h-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 transition-all md:mx-1 md:h-12 md:flex-row md:gap-2 md:px-3 ${
                isActive
                  ? "text-emerald-700 md:bg-emerald-50 md:shadow-inner"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon
                className={`${isActive ? "h-6 w-6" : "h-5 w-5"} shrink-0 transition-all group-hover:scale-105`}
                strokeWidth={isActive ? 3 : 2}
              />
              <span
                className={`mt-0.5 block max-w-full truncate text-[9px] font-black uppercase leading-tight tracking-tight md:mt-0 md:text-[10px] md:tracking-wide ${
                  isActive ? "opacity-100" : "opacity-60"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Botão Flutuante Central */}
        <Button
          type="button"
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="absolute -top-6 left-1/2 z-50 h-14 w-14 -translate-x-1/2 rounded-2xl border-4 border-white bg-emerald-600 p-0 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-xl active:scale-90 md:-top-5 md:h-16 md:w-16 md:rounded-[1.35rem]"
          aria-label="Criar nova lista"
        >
          <Plus className="w-8 h-8 text-white" strokeWidth={3} />
        </Button>
        </div>
      </nav>

      {/* MODAL GLOBAL DE CRIAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <Card className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border-none shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-[2.5rem]">
            <CardContent className="p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">
                  Nova Lista
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"
                  aria-label="Fechar"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic">
                    Nome da Lista
                  </label>
                  <Input
                    placeholder="Ex: Compras da Semana"
                    className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold px-6"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic">
                    Limite de Gasto (Budget)
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 italic">
                      R$
                    </span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold pl-14"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg shadow-lg shadow-emerald-100 mt-2"
                >
                  {isSubmitting ? "Criando..." : "Criar Agora"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
