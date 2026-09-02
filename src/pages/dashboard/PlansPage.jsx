import React, { useState, useEffect } from "react";
import { ChevronLeft, Check, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0/mês",
    description: "Ideal para organizar suas compras essenciais de forma inteligente.",
    features: [
      "Listas de compras básicas",
      "Controle simples de orçamento",
      "Detecção básica de ingredientes",
      "Checklists interativos",
      "Uso pessoal exclusivo",
    ],
    buttonText: "Começar Agora",
    buttonClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    badge: null,
    accent: "from-slate-50 to-white border-slate-200 text-slate-900",
  },
  {
    name: "Plus",
    price: "R$ 9,90/mês",
    description: "Para quem leva a economia a sério e quer comparar os mercados.",
    features: [
      "Tudo do plano Gratuito",
      "Comparação entre múltiplos mercados",
      "Histórico de listas e economia",
      "Controle de gastos avançado",
      "Compartilhar listas com até 2 pessoas",
    ],
    buttonText: "Testar o Plus",
    buttonClass: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20",
    badge: "Mais Vantajoso",
    accent: "from-emerald-600 to-teal-700 text-white border-emerald-500",
  },
  {
    name: "Premium",
    price: "R$ 19,90/mês",
    description: "Para famílias que buscam controle total e recursos avançados.",
    features: [
      "Comparação ilimitada de mercados",
      "Relatórios completos de economia",
      "Notificações de otimização",
      "Recursos de organização familiar",
      "Compartilhar listas com até 5 pessoas",
    ],
    buttonText: "Seja Premium",
    buttonClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    badge: null,
    accent: "from-slate-50 to-white border-slate-200 text-slate-900",
  },
];

export default function PlansPage() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(() => {
    return localStorage.getItem("userCurrentPlan") || "Gratuito";
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32 font-sans flex flex-col transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-6 pt-12 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Planos e Assinaturas</h1>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 mt-4">
        <div className="text-center space-y-2 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">Investimento</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Escolha o plano ideal</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Comece de graça e descubra como o nosso assistente transforma a sua forma de se organizar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {plans.map((plan) => {
            const isPopular = plan.name === "Plus";
            const isPremium = plan.name === "Premium";
            const isCurrent = plan.name === currentPlan;

            return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-[2rem] border p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  isPopular
                    ? "bg-gradient-to-b from-emerald-600 to-teal-700 text-white shadow-emerald-900/20 border-emerald-500"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-4 right-6 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    {plan.badge}
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute -top-4 left-6 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    Seu plano atual
                  </span>
                )}

                <div className="mb-6 flex items-center gap-2">
                  {isPremium ? (
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
                      <Crown size={18} strokeWidth={3} />
                    </div>
                  ) : isPopular ? (
                    <div className="bg-white/15 text-white p-2 rounded-xl">
                      <Sparkles size={18} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                      <Check size={18} strokeWidth={3} />
                    </div>
                  )}
                  <h3 className={`text-2xl lg:text-3xl font-black tracking-tight ${isPopular ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                </div>

                <p className={`text-sm mb-8 min-h-[48px] leading-relaxed ${isPopular ? "text-emerald-100" : "text-slate-500"}`}>
                  {plan.description}
                </p>

                <div className="flex items-end mb-8 border-b pb-8 border-opacity-20 border-slate-200">
                  <span className={`text-5xl lg:text-6xl font-black tracking-tighter ${isPopular ? "text-white" : "text-slate-900"}`}>
                    {plan.price.split("/")[0]}
                  </span>
                  <span className={`ml-1 text-xl font-medium mb-2 ${isPopular ? "text-emerald-200" : "text-slate-400"}`}>
                    {plan.price.split("/")[1] ? `/${plan.price.split("/")[1]}` : ""}
                  </span>
                </div>

                <ul className="flex-1 space-y-4 text-left mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`mt-1 p-1 rounded-full ${isPopular ? "bg-white/20" : "bg-emerald-50"}`}>
                        <Check className={`w-3 h-3 ${isPopular ? "text-white" : "text-emerald-600"}`} strokeWidth={3} />
                      </div>
                      <span className={`text-[15px] font-medium leading-tight ${isPopular ? "text-white/90" : "text-slate-600"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={`w-full font-bold py-4 rounded-2xl transition-all duration-300 ${
                    isCurrent
                      ? isPopular
                        ? "bg-white/30 text-white cursor-default"
                        : "bg-slate-100 text-slate-600 cursor-default"
                      : isPopular
                      ? "bg-white text-emerald-700 hover:bg-slate-100"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {isCurrent ? "Usando atualmente" : plan.buttonText}
                </button>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
