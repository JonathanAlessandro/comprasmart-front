import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, Loader2, Minus, Plus, Search, ShoppingBag, Store, Tag, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import MarketComparisonModal from "@/components/MarketComparisonModal";
import api from "@/services/api";
import { useLists } from "@/contexts/ListContext";
import { CATEGORY_MAP, getCategory } from "@/utils/categoryMap";

const ALLERGY_MAP = {
  Lactose: ["leite", "queijo", "iogurte", "manteiga", "requeijão", "creme de", "whey"],
  Glúten: ["pão", "farinha", "macarrão", "cerveja", "biscoito", "bolacha", "bolo"],
  Vegetariano: ["carne", "frango", "peixe", "bacon", "presunto", "salsicha", "linguiça"],
  Vegano: ["carne", "frango", "peixe", "ovo", "leite", "mel", "queijo", "manteiga"],
  Amendoim: ["paçoca", "amendoim", "castanha", "noz", "avelã", "pistache", "nutella"],
};

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export default function ListDetailsPage() {
  const { id } = useParams();
  const {
    lists,
    searchProducts,
    addItemToList,
    updateItemQuantity,
    updateItemPrice,
    toggleItemStatus,
    deleteItem,
    compareList,
    fetchLists,
  } = useLists();

  const [list, setList] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    price: "",
    productId: null,
    category: null,
    unit: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [userAllergies, setUserAllergies] = useState([]);
  const [allergyConflict, setAllergyConflict] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [selectedMarkets, setSelectedMarkets] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      // 1. Tenta usar o cache do contexto primeiro para UX imediato
      const cached = lists.find((currentList) => String(currentList._id || currentList.id) === String(id));
      if (cached && !cancelled) setList(cached);

      // 2. Faz refresh direto do backend para garantir itens novos (criados via receita)
      setRefreshing(true);
      try {
        const fresh = await api.get(`/api/lists/${encodeURIComponent(String(id))}`).catch(async () => {
          await fetchLists();
          return null;
        });
        if (cancelled) return;
        if (fresh?.data) setList(fresh.data);
        else {
          const reloaded = await fetchLists();
          if (!cancelled && Array.isArray(reloaded)) {
            const found = reloaded.find((currentList) => String(currentList._id || currentList.id) === String(id));
            if (found) setList(found);
          }
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [lists, id, fetchLists]);

  useEffect(() => {
    let active = true;
    api.get("/users/profile")
      .then(({ data }) => {
        if (active) setUserAllergies(data.allergies || []);
      })
      .catch(() => {
        if (active) setUserAllergies([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = newItem.name.trim();
    if (query.length < 2 || newItem.productId) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const products = await searchProducts(query, 10);
        if (active) {
          setSuggestions(products);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [newItem.name, newItem.productId]);

  useEffect(() => {
    const input = newItem.name.toLowerCase().trim();
    if (input.length < 2) {
      setAllergyConflict(null);
      return;
    }

    let found = null;
    userAllergies.forEach((allergy) => {
      const allergyName = typeof allergy === "string" ? allergy : allergy.name;
      if (!allergyName) return;
      const normalized = allergyName.toLowerCase();
      const derivatives = ALLERGY_MAP[allergyName] || [];
      if (derivatives.some((term) => input.includes(term)) || input.includes(normalized)) {
        found = allergyName;
      }
    });
    setAllergyConflict(found);
  }, [newItem.name, userAllergies]);

  const items = list?.items || [];
  const totalItems = items.length;
  const checkedItemsList = items.filter((item) => item.checked);
  const checkedItems = checkedItemsList.length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  // Total geral (todos os itens) — usado para verificar orçamento
  const totalAll = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  // Total dos itens marcados — exibido no rodapé para o usuário acompanhar o que já colocou no carrinho
  const total = checkedItemsList.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const budget = Number(list?.budget || 0);
  const overBudget = budget > 0 && totalAll > budget;

  const groupedItems = useMemo(() => (
    Object.keys(CATEGORY_MAP).concat("Outros").map((categoryName) => ({
      categoryName,
      items: items.filter((item) => (item.category || getCategory(item.name)) === categoryName),
    })).filter((group) => group.items.length > 0)
  ), [items]);

  if (!list) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-xs font-black uppercase tracking-widest text-slate-400">
        <span className="animate-pulse">Preparando lista...</span>
      </div>
    );
  }

  const chooseSuggestion = (product) => {
    setNewItem((current) => ({
      ...current,
      name: product.name,
      productId: product.id,
      // Nunca sobrescreve o preço do usuário — o campo de preço fica sempre livre para digitar
      price: current.price,
      category: product.category || getCategory(product.name),
      unit: product.unit || null,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleNameChange = (value) => {
    setNewItem((current) => ({
      ...current,
      name: value,
      productId: null,
      category: null,
      unit: null,
    }));
    setShowSuggestions(true);
  };

  const confirmAdd = async () => {
    if (!newItem.name.trim() || savingItem) return;
    setSavingItem(true);
    try {
      await addItemToList(list._id, {
        name: newItem.name.trim(),
        productId: newItem.productId,
        quantity: Math.max(1, Number(newItem.quantity) || 1),
        price: newItem.price !== "" ? Number(String(newItem.price).replace(",", ".")) : null,
        category: newItem.category || getCategory(newItem.name),
        unit: newItem.unit || null,
      });
      setNewItem({ name: "", quantity: 1, price: "", productId: null, category: null, unit: null });
      setSuggestions([]);
      setShowSuggestions(false);
      setAllergyConflict(null);
      setShowConfirmModal(false);
    } catch (error) {
      setComparisonError(error.response?.data?.error || "Não foi possível adicionar o produto.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleAddAttempt = (event) => {
    event.preventDefault();
    if (!newItem.name.trim()) return;
    if (allergyConflict) setShowConfirmModal(true);
    else confirmAdd();
  };

  const changeQuantity = async (item, delta) => {
    const nextQuantity = Math.max(1, Number(item.quantity) + delta);
    try {
      await updateItemQuantity(list._id, item._id, nextQuantity);
    } catch (error) {
      setComparisonError(error.response?.data?.error || "Não foi possível atualizar a quantidade.");
    }
  };

  const handlePriceBlur = async (item, newPriceValue) => {
    const cleaned = String(newPriceValue).replace(",", ".").trim();
    const parsed = cleaned === "" ? null : Number(cleaned);
    if (parsed !== null && isNaN(parsed)) return;
    if (parsed === item.price) return;

    try {
      await updateItemPrice(list._id, item._id, parsed);
    } catch (error) {
      setComparisonError(error.response?.data?.error || "Não foi possível atualizar o preço.");
    }
  };

  const openComparison = async (markets = null) => {
    setComparisonOpen(true);
    setComparisonLoading(true);
    setComparisonError("");
    try {
      const result = await compareList(list._id, markets || selectedMarkets);
      setComparison(result);
      if (!markets) {
        setSelectedMarkets((current) => current.length > 0 ? current : (result.availableMarkets || []).map((market) => market.source));
      }
    } catch (error) {
      setComparisonError(error.response?.data?.error || "Não foi possível consultar os preços dos mercados.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const toggleMarket = (source) => {
    setSelectedMarkets((current) => current.includes(source)
      ? current.filter((market) => market !== source)
      : [...current, source]);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] px-4 pb-96 font-sans md:px-8">
      {showConfirmModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-md">
          <Card className="w-full max-w-sm rounded-[2rem] border-none bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-900">Risco detectado</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              O produto <strong className="text-red-600">{newItem.name}</strong> pode conter ingredientes relacionados à sua restrição de <strong>{allergyConflict}</strong>.
            </p>
            <div className="mt-7 grid gap-3">
              <Button onClick={confirmAdd} disabled={savingItem} className="h-12 rounded-xl bg-red-600 font-black text-white hover:bg-red-700">
                {savingItem ? "Adicionando..." : "Ignorar e adicionar"}
              </Button>
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="h-12 rounded-xl font-black text-slate-500">
                Cancelar inclusão
              </Button>
            </div>
          </Card>
        </div>
      )}

      <MarketComparisonModal
        isOpen={comparisonOpen}
        comparison={comparison}
        loading={comparisonLoading}
        error={comparisonError}
        selectedMarkets={selectedMarkets}
        onToggleMarket={toggleMarket}
        onConfirm={() => openComparison(selectedMarkets)}
        onClose={() => setComparisonOpen(false)}
      />

      <div className="mx-auto max-w-3xl space-y-7 pt-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Lista de compras</p>
            <h1 className="mt-1 text-4xl font-black leading-none tracking-tight text-slate-900">{list.name}</h1>
            <p className="mt-3 text-sm font-semibold text-slate-500">Adicione produtos, defina seus preços e compare com os mercados quando desejar.</p>
          </div>
          <Button
            type="button"
            onClick={() => openComparison()}
            disabled={items.length === 0}
            className="h-12 rounded-2xl bg-slate-900 px-6 font-black text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            <Store className="mr-2" size={18} /> Comparar Preços
          </Button>
        </header>

        {/* Card Formulário de Inserção de Produto com Preço e Qtd */}
        <Card className={`rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${allergyConflict ? "bg-red-50 ring-2 ring-red-400" : "bg-white"}`}>
          <CardContent className="p-5 md:p-7">
            <form onSubmit={handleAddAttempt} className="space-y-4">
              {/* Campo Nome do Produto com Autocomplete */}
              <div className="relative">
                <label className="mb-2 block pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nome do Produto
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <Input
                    value={newItem.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Ex.: Arroz 5kg, Leite integral, Sabão em pó..."
                    className={`h-14 rounded-2xl border-transparent bg-slate-50 pl-12 pr-12 text-base font-bold shadow-inner focus:bg-white ${allergyConflict ? "text-red-700 focus:ring-red-200" : "focus:ring-blue-100"}`}
                    autoComplete="off"
                    required
                  />
                  {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={18} />}
                </div>

                {/* Dropdown de sugestões do scraper */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5">
                      Sugestões do catálogo (clique para preencher)
                    </p>
                    {suggestions.map((product) => (
                      <button
                        key={`${product.source}-${product.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseSuggestion(product)}
                        className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-slate-800">{product.name}</span>
                          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {product.market}{product.unit ? ` · ${product.unit}` : ""}
                          </span>
                        </span>
                        {product.effectivePrice !== null && (
                          <span className="shrink-0 text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            Ref: {formatCurrency(product.effectivePrice)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantidade, Preço Manual e Botão Adicionar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Qtd */}
                <div className="sm:col-span-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 h-14 shadow-inner">
                  <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItem((current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-100"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="min-w-7 text-center text-base font-black text-slate-800">{newItem.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setNewItem((current) => ({ ...current, quantity: current.quantity + 1 }))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-100"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Preço Unitário Informado pelo Usuário */}
                <div className="sm:col-span-4 relative">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Preço (ex: 15,90)"
                      value={newItem.price}
                      onChange={(e) => setNewItem((current) => ({ ...current, price: e.target.value }))}
                      className="h-14 rounded-2xl border-transparent bg-slate-50 pl-10 pr-3 text-base font-bold shadow-inner focus:bg-white focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Botão Adicionar */}
                <div className="sm:col-span-4">
                  <Button
                    type="submit"
                    disabled={savingItem || !newItem.name.trim()}
                    className="w-full h-14 rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {savingItem ? "Adicionando..." : <><Plus className="mr-1.5" size={18} /> Adicionar</>}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>💡 Você pode definir seu preço estimado agora ou editar direto na lista abaixo.</span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Banner do Último Comparativo */}
        {comparison?.cheapestMarket && (
          <button
            type="button"
            onClick={() => openComparison()}
            className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 text-left transition shadow-sm hover:shadow-md hover:border-emerald-300"
          >
            <span className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Store size={20} />
              </div>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Melhor Mercado para sua Lista
                </span>
                <span className="font-black text-emerald-950 text-base">
                  {comparison.cheapestMarket.market}
                </span>
              </span>
            </span>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-700">
                {formatCurrency(comparison.cheapestMarket.total)}
              </span>
              <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Clique para ver todos
              </span>
            </div>
          </button>
        )}

        {comparisonError && !comparisonOpen && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {comparisonError}
            <button type="button" onClick={() => setComparisonError("")} className="ml-auto">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Listagem de Itens da Lista */}
        <div className="space-y-8">
          {groupedItems.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center shadow-sm">
              <ShoppingBag className="mx-auto text-blue-300" size={48} />
              <h2 className="mt-4 text-2xl font-black text-slate-800">Sua lista está vazia</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500">
                Digite o nome de um produto, informe o preço e a quantidade para montar sua lista de compras.
              </p>
            </div>
          ) : (
            groupedItems.map(({ categoryName, items: categoryItems }) => (
              <section key={categoryName} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{categoryName}</h2>
                  <span className="rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-black text-slate-500">
                    {categoryItems.length}
                  </span>
                </div>

                {categoryItems.map((item) => (
                  <div
                    key={item._id}
                    className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                      item.checked
                        ? "border-transparent bg-slate-100/60 opacity-55"
                        : "border-transparent bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-blue-100"
                    }`}
                  >
                    {/* Checkbox e Nome do Produto */}
                    <div className="flex min-w-0 items-center gap-4 flex-1">
                      <div className={`rounded-xl p-1 ${item.checked ? "bg-slate-200" : "bg-blue-50"}`}>
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItemStatus(list._id, item._id)}
                          className="h-6 w-6 rounded-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-base font-black ${item.checked ? "text-slate-400 line-through" : "text-slate-800"}`}>
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {item.unit ? `${item.unit} · ` : ""}
                          {item.category || "Geral"}
                        </p>
                      </div>
                    </div>

                    {/* Preço Unitário Editável, Quantidade e Subtotal */}
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      {/* Preço Unitário (referência / preço sugestão do mercado) */}
                      <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <Tag size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={item.price > 0 ? item.price : ""}
                          placeholder="0,00"
                          onBlur={(e) => handlePriceBlur(item, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                          }}
                          className="w-16 bg-transparent text-xs font-black text-slate-800 focus:outline-none focus:ring-0"
                          title="Preço unitário de referência (clique para editar)"
                        />
                      </div>

                      {/* Contador de Quantidade */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item, -1)}
                          disabled={item.quantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100 disabled:opacity-30"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="min-w-5 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Subtotal (EDITÁVEL — o usuário clica aqui para mudar o preço) */}
                      <div
                        className={`min-w-[120px] sm:min-w-[140px] rounded-xl border px-3 py-1.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${
                          item.checked
                            ? "border-slate-100 bg-slate-50 text-slate-400"
                            : "border-slate-200 bg-white text-slate-900 hover:border-blue-200"
                        }`}
                        title="Clique para editar o preço do item (subtotal = preço unitário × qtd)"
                      >
                        <label className="flex items-baseline justify-end gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price > 0 ? (Number(item.price) * Number(item.quantity)).toFixed(2) : ""}
                            placeholder="0,00"
                            onChange={(e) => {
                              const raw = String(e.target.value).trim();
                              if (raw === "" || Number.isNaN(Number(raw))) return;
                              const subtotal = Number(raw);
                              const qty = Number(item.quantity) || 1;
                              const unitPrice = Number((subtotal / qty).toFixed(2));
                              handlePriceBlur(item, String(unitPrice));
                              e.target.value = subtotal > 0 ? subtotal.toFixed(2) : "";
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            className={`w-full bg-transparent text-right text-sm font-black focus:outline-none focus:ring-0 ${
                              item.checked ? "line-through text-slate-400" : "text-slate-900"
                            }`}
                          />
                        </label>
                      </div>

                      {/* Botão Remover */}
                      <button
                        type="button"
                        onClick={() => deleteItem(list._id, item._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
      </div>

      {/* Barra Inferior com Subtotal e Meta de Orçamento */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/85 px-5 py-5 shadow-[0_-20px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl md:bottom-[72px] md:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {overBudget && showWarning && (
            <div className="flex items-center justify-between rounded-2xl bg-red-600 p-3 text-white shadow-lg shadow-red-500/20">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <AlertCircle size={17} /> Limite de orçamento ultrapassado
              </span>
              <button type="button" onClick={() => setShowWarning(false)}>
                <X size={17} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2">
              <Check size={15} className="text-blue-500" /> Itens marcados (no carrinho)
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
              {checkedItems} / {totalItems}
            </span>
          </div>
          <Progress value={progress} className="h-3 rounded-full bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-blue-400" />
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Check size={12} className="text-blue-500" />
                Total no Carrinho (itens marcados)
              </p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${overBudget ? "text-red-500" : "text-blue-600"}`}>
                {formatCurrency(total)}
              </p>
              {totalAll > 0 && (
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Lista completa: {formatCurrency(totalAll)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta</p>
              <p className="mt-1 text-lg font-black text-slate-600">
                {budget > 0 ? formatCurrency(budget) : "Sem limite"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
