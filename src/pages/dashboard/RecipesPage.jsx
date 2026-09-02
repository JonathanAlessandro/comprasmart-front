import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AllergenWarningPopup from "@/components/AllergenWarningPopup.jsx";
import {
  Search,
  ChefHat,
  ShoppingBag,
  Check,
  Store,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Utensils,
  ExternalLink,
  Youtube,
  AlertCircle,
  Plus,
  X,
  Loader2,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLists } from "@/contexts/ListContext";
import api from "@/services/api";

const CATEGORY_FILTERS = [
  { id: "Todas", label: "Todas", icon: "✨" },
  { id: "Almoço", label: "Almoço", icon: "🍛" },
  { id: "Jantar", label: "Jantar", icon: "🍽️" },
  { id: "Salgados", label: "Salgados", icon: "🍝" },
  { id: "Doces", label: "Doces", icon: "🍰" },
  { id: "Sobremesas", label: "Sobremesas", icon: "🍨" },
  { id: "Café da manhã", label: "Café da manhã", icon: "🍳" },
  { id: "Refeições leves", label: "Refeições leves", icon: "🥗" },
];

const POPULAR_SEARCHES = [
  "Lasanha", "Bolo de chocolate", "Frango ao curry", "Risoto",
  "Panqueca", "Pizza", "Salmão", "Hambúrguer",
];

export default function RecipesPage() {
  const navigate = useNavigate();
  const { lists, addItemToList, addList, fetchLists } = useLists();

  const [activeMode, setActiveMode] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Modal de detalhes da receita
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState("");

  // Modal de "adicionar ingredientes faltantes a uma lista"
  const [addFlowOpen, setAddFlowOpen] = useState(false);
  const [addFlowStep, setAddFlowStep] = useState("choose"); // "choose" | "newName" | "pickList"
  const [newListNameInput, setNewListNameInput] = useState("");

  // Alergias
  const [userAllergies, setUserAllergies] = useState([]);
  const [allergenPopupOpen, setAllergenPopupOpen] = useState(false);
  const [allergenMatches, setAllergenMatches] = useState([]);
  const [allergenChecking, setAllergenChecking] = useState(false);
  const [allergenConfirmPayload, setAllergenConfirmPayload] = useState({
    mode: null, // "new" | "existing"
    list: null,
    includeAvailable: false,
  });

  useEffect(() => {
    api.get("/users/profile").then((r) => {
      if (r?.data?.allergies && Array.isArray(r.data.allergies)) setUserAllergies(r.data.allergies);
    }).catch(() => {});
  }, []);

  // Modo despensa / lista
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [customProductInput, setCustomProductInput] = useState("");

  useEffect(() => {
    if (lists.length > 0 && selectedListId) {
      const selectedList = lists.find(
        (list) => String(list.id ?? list._id) === String(selectedListId)
      );
      const items = (selectedList?.items || []).map((i) => i.name.trim());
      const unique = [...new Set(items)].filter(Boolean);
      setSelectedProducts(unique);
    } else if (lists.length > 0 && !selectedListId) {
      setSelectedListId(String(lists[0].id ?? lists[0]._id));
    } else if (lists.length === 0) {
      setSelectedProducts([]);
      setSelectedListId("");
    }
  }, [lists, selectedListId]);

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/recipes/random");
      if (data?.recipes?.length) setRecipes(data.recipes);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  // Modo 1: pesquisa pelo nome
  async function handleSearch(e, forced = null) {
    if (e) e.preventDefault();
    const query = (forced ?? searchTerm).trim();
    if (!query) return;
    if (forced != null) setSearchTerm(forced);

    setLoading(true);
    setError("");
    setHasSearched(true);
    setActiveMode("search");

    try {
      const { data } = await api.get("/api/recipes/search", { params: { q: query } });
      setRecipes(data?.recipes || []);
      if (!data?.recipes?.length && data?.message) setError(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível pesquisar receitas. Verifique sua conexão.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  // Modo 2: receitas pelos produtos
  async function handleSearchByProducts() {
    const chosenListId = selectedListId ? Number(selectedListId) : null;
    if (chosenListId) {
      setLoading(true);
      setError("");
      setHasSearched(true);
      setActiveMode("pantry");
      try {
        const { data } = await api.get(`/api/recipes/by-list/${chosenListId}`);
        setRecipes(data?.recipes || []);
        if (data?.products?.length) setSelectedProducts(data.products);
        if (!data?.recipes?.length && data?.message) setError(data.message);
      } catch (err) {
        setError(err.response?.data?.error || "Não foi possível utilizar a lista para pesquisar receitas.");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedProducts.length) {
      setError("Adicione ao menos um produto para pesquisar.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(true);
    setActiveMode("pantry");

    try {
      const { data } = await api.post("/api/recipes/from-products", { products: selectedProducts });
      setRecipes(data?.recipes || []);
      if (!data?.recipes?.length && data?.message) setError(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível encontrar receitas. Tente novamente.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  // Abre o modal e busca detalhes completos (tradução de ingredientes + instruções)
  async function handleOpenRecipe(recipe) {
    setSelectedRecipe(recipe); // mostra o modal imediatamente com o que já temos
    setAddSuccessMessage("");
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      const { data } = await api.get(`/api/recipes/${recipe.idMeal}`);
      setSelectedRecipe(data);
    } catch {
      // mantém o que já tinha
    } finally {
      setLoadingDetail(false);
    }
  }

  function toggleProduct(name) {
    setSelectedProducts((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  function handleAddCustomProduct(e) {
    e.preventDefault();
    const t = customProductInput.trim();
    if (!t) return;
    if (!selectedProducts.some((p) => p.toLowerCase() === t.toLowerCase())) {
      setSelectedProducts((prev) => [...prev, t]);
    }
    setCustomProductInput("");
  }

  // --- Fluxo de "criar lista com ingredientes" (substitui window.confirm/prompt) ---

  function hasRecipeScoring() {
    if (!selectedRecipe) return false;
    return (
      Array.isArray(selectedRecipe.missingIngredients) &&
      Array.isArray(selectedRecipe.availableIngredients) &&
      (selectedRecipe.missingIngredients.length > 0 || selectedRecipe.availableIngredients.length > 0)
    );
  }

  function getAllIngredientNames() {
    if (!selectedRecipe) return [];
    const list = selectedRecipe.ingredientsTranslated || selectedRecipe.ingredients || [];
    return list
      .map((item) => item.translated || item.name || item.original || "")
      .filter(Boolean);
  }

  function getMissingIngredientNames() {
    if (!hasRecipeScoring()) return getAllIngredientNames();
    return (selectedRecipe?.missingIngredients || []).map((item) => item.name).filter(Boolean);
  }

  function openAddIngredientsFlow() {
    const scored = hasRecipeScoring();
    const missing = getMissingIngredientNames();
    const allIngredients = getAllIngredientNames();

    if (!allIngredients.length) {
      setError("Esta receita ainda não tem ingredientes carregados. Aguarde o carregamento e tente novamente.");
      return;
    }

    if (scored && !missing.length) {
      setAddSuccessMessage("Você já possui todos os ingredientes desta receita.");
      return;
    }

    setError("");
    setAddSuccessMessage("");
    setNewListNameInput(selectedRecipe?.strMealPt || selectedRecipe?.strMeal || "");
    setAddFlowStep("choose");
    setAddFlowOpen(true);
  }

  function closeAddFlow(open) {
    if (addingToList) return; // não fecha durante o carregamento
    setAddFlowOpen(open);
    if (!open) setAddFlowStep("choose");
  }

  async function checkAllergensAndContinue(items, payload) {
    const names = items.map((i) => String(i.translated || i.name || i.original || "").trim()).filter(Boolean);
    const hasAllergies = Array.isArray(userAllergies) && userAllergies.length > 0;
    if (!hasAllergies || !names.length) {
      return { ok: true, skip: true };
    }
    setAllergenChecking(true);
    setAllergenMatches([]);
    try {
      const { data } = await api.post("/api/allergens/check/batch", { items: names });
      const matches = Array.isArray(data?.matches) ? data.matches : [];
      if (!matches.length) return { ok: true, skip: true };
      setAllergenMatches(matches);
      setAllergenConfirmPayload(payload);
      setAllergenPopupOpen(true);
      return { ok: false, skip: false };
    } catch {
      return { ok: true, skip: true };
    } finally {
      setAllergenChecking(false);
    }
  }

  async function executeAllergenConfirmedShoppingList() {
    const { mode, list, includeAvailable } = allergenConfirmPayload || {};
    setAllergenPopupOpen(false);
    if (mode === "new") await handleCreateNewListWithIngredients({ force: true, includeAvailable });
    if (mode === "existing" && list) await handleAddToExistingList(list, { force: true, includeAvailable });
  }

  function getRecipeIngredientsForShopping() {
    const scored = hasRecipeScoring();
    const all = selectedRecipe?.ingredientsTranslated || selectedRecipe?.ingredients || [];
    if (scored) {
      const missing = Array.isArray(selectedRecipe.missingIngredients) ? selectedRecipe.missingIngredients : [];
      if (!missing.length) return [];
      return missing.map((ing) => {
        const matched = all.find((i) => {
          const orig = String(i.original || i.name || "").toLowerCase().trim();
          const cmp = String(ing.name || ing.original || "").toLowerCase().trim();
          return orig && cmp && (orig === cmp || orig.includes(cmp) || cmp.includes(orig));
        });
        return matched || { ...ing, translated: ing.name, measure: ing.measure || "" };
      });
    }
    return all.map((ing) => ({
      original: ing.original || ing.name || "",
      translated: ing.translated || ing.name || ing.original || "",
      measure: ing.measure ?? null,
    }));
  }

  async function handleCreateNewListWithIngredients(opts = {}) {
    const name = newListNameInput.trim();
    if (!name || !selectedRecipe?.idMeal) return;

    const scored = hasRecipeScoring();
    const includeAvailable = typeof opts.includeAvailable === "boolean" ? opts.includeAvailable : (scored ? false : true);

    if (!opts.force) {
      const items = getRecipeIngredientsForShopping();
      const check = await checkAllergensAndContinue(items, { mode: "new", list: null, includeAvailable });
      if (!check.ok) return;
    }

    setAddingToList(true);
    try {
      const { data } = await api.post(`/api/recipes/${selectedRecipe.idMeal}/shopping-list`, {
        name,
        includeAvailable,
      });
      const savedList = data?.list;
      await fetchLists();
      setAddSuccessMessage(
        savedList
          ? `✓ Lista "${savedList.name}" criada com ${data.addedCount || savedList.items?.length || 0} ingrediente(s).`
          : (data?.message || `✓ Ingredientes adicionados à nova lista "${name}".`)
      );
      setAddFlowOpen(false);
      setAddFlowStep("choose");
      if (savedList?._id || savedList?.id) {
        window.setTimeout(() => {
          navigate(`/dashboard/lists/${String(savedList._id || savedList.id)}`);
        }, 850);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível criar a lista com os ingredientes.");
    } finally {
      setAddingToList(false);
    }
  }

  async function handleAddToExistingList(list, opts = {}) {
    if (!selectedRecipe?.idMeal) return;
    const targetId = list._id || list.id;
    if (!targetId) return;

    const scored = hasRecipeScoring();
    const includeAvailable = typeof opts.includeAvailable === "boolean" ? opts.includeAvailable : (scored ? false : true);

    if (!opts.force) {
      const items = getRecipeIngredientsForShopping();
      const check = await checkAllergensAndContinue(items, { mode: "existing", list, includeAvailable });
      if (!check.ok) return;
    }

    setAddingToList(true);
    try {
      const { data } = await api.post(`/api/recipes/${selectedRecipe.idMeal}/shopping-list`, {
        listId: Number(targetId),
        includeAvailable,
      });
      const savedList = data?.list;
      await fetchLists();
      setAddSuccessMessage(
        savedList
          ? `✓ ${data.addedCount || 0} ingrediente(s) adicionados à lista "${savedList.name}".`
          : (data?.message || `✓ Ingredientes adicionados à lista "${list.name}".`)
      );
      setAddFlowOpen(false);
      setAddFlowStep("choose");
      if (savedList?._id || savedList?.id) {
        window.setTimeout(() => {
          navigate(`/dashboard/lists/${String(savedList._id || savedList.id)}`);
        }, 850);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Não foi possível atualizar a lista com os ingredientes.");
    } finally {
      setAddingToList(false);
    }
  }

  const missingCount = getMissingIngredientNames().length;

  const filteredRecipes = useMemo(() => {
    if (selectedCategory === "Todas") return recipes;
    return recipes.filter((r) => (r.mealTypes || []).includes(selectedCategory));
  }, [recipes, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36 font-sans flex flex-col">

      {/* HEADER */}
      <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-40 p-4 sm:p-5 md:p-6 border-b border-white shadow-sm flex items-center">
        <div className="flex items-center gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
            <ChevronLeft size={20} strokeWidth={3} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">
              Inteligência de Receitas
            </h1>
            <p className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0" />
              <span className="truncate">Descubra pratos e encontre o que você tem em casa</span>
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 sm:space-y-7 flex-1">

        {/* SELETOR DE MODO */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-white p-2 rounded-[1.8rem] shadow-sm border border-slate-100">
          <button type="button" onClick={() => setActiveMode("search")}
            className={`py-3 sm:py-3.5 px-2 sm:px-4 rounded-[1.4rem] font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${activeMode === "search" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}>
            <Search size={16} strokeWidth={2.5} className="shrink-0" /> <span className="truncate">Pesquisar Receita</span>
          </button>
          <button type="button" onClick={() => setActiveMode("pantry")}
            className={`py-3 sm:py-3.5 px-2 sm:px-4 rounded-[1.4rem] font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${activeMode === "pantry" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}>
            <ShoppingBag size={16} strokeWidth={2.5} className="shrink-0" /> <span className="truncate">Com Meus Produtos</span>
          </button>
        </div>

        {/* MODO 1: PESQUISA DIRETA */}
        {activeMode === "search" && (
          <section className="animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 text-white overflow-hidden relative">
              <div className="absolute -right-6 -bottom-6 opacity-15">
                <ChefHat size={160} strokeWidth={1} />
              </div>
              <CardContent className="p-5 sm:p-6 md:p-8 relative z-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter drop-shadow-md mb-2">
                  O que vamos cozinhar hoje?
                </h2>
                <p className="text-orange-100 text-xs md:text-sm font-medium mb-6 leading-relaxed max-w-md">
                  Digite o nome de um prato em português e encontre a receita completa.
                </p>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <Input
                      className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border-none shadow-inner bg-white text-slate-900 font-bold text-sm sm:text-base md:text-lg focus-visible:ring-2 focus-visible:ring-orange-300"
                      placeholder="Ex: Bolo de Chocolate, Lasanha, Frango..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !searchTerm.trim()}
                    className="h-12 sm:h-14 px-8 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-base shadow-lg shrink-0 active:scale-95 transition-transform">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Buscar"}
                  </Button>
                </form>
                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-orange-100 mr-1">Populares:</span>
                  {POPULAR_SEARCHES.map((item) => (
                    <button key={item} type="button" onClick={(e) => handleSearch(e, item)}
                      className="text-[11px] font-bold bg-white/20 hover:bg-white text-white hover:text-orange-600 px-3 py-1 rounded-full transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* MODO 2: DESPENSA / MEUS PRODUTOS */}
        {activeMode === "pantry" && (
          <section className="animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] sm:rounded-[2.5rem] bg-white overflow-hidden p-5 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl shrink-0">
                  <ShoppingBag size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">Receitas com o que você tem em casa</h2>
                  <p className="text-xs text-slate-500 font-medium">Selecione os ingredientes disponíveis e veja o que dá para preparar.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ingredientes selecionados ({selectedProducts.length}):
                  </p>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 w-full md:w-auto">
                    <span className="shrink-0">Lista</span>
                    <select
                      value={selectedListId}
                      onChange={(event) => setSelectedListId(event.target.value)}
                      className="bg-transparent font-bold text-slate-700 outline-none w-full min-w-0"
                    >
                      {lists.length === 0 ? (
                        <option value="">Crie uma lista</option>
                      ) : (
                        lists.map((list) => (
                          <option key={list.id ?? list._id} value={String(list.id ?? list._id)}>
                            {list.name}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 min-h-8">
                  {selectedProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum produto adicionado ainda.</p>
                  ) : selectedProducts.map((prod) => (
                    <span key={prod} className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <Check size={13} className="text-orange-600" strokeWidth={3} />
                      {prod}
                      <button type="button" onClick={() => toggleProduct(prod)} className="text-orange-400 hover:text-orange-700 ml-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddCustomProduct} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Input
                    placeholder="Adicionar produto (ex: Queijo, Alho, Batata)..."
                    value={customProductInput}
                    onChange={(e) => setCustomProductInput(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold"
                  />
                  <Button type="submit" variant="outline" className="h-12 px-4 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold text-xs shrink-0 w-full sm:w-auto">
                    <Plus size={16} className="mr-1" /> Adicionar
                  </Button>
                </form>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSearchByProducts} disabled={loading || !selectedProducts.length}
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 className="animate-spin" size={20} /> Procurando receitas...</>
                    : <><Sparkles size={18} /> Descobrir Receitas</>}
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* FILTROS DE CATEGORIA */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1.5">
              <Filter size={13} /> Categoria
            </h3>
            <span className="text-[11px] font-bold text-slate-400">{filteredRecipes.length} receita(s)</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORY_FILTERS.map((cat) => (
              <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-md scale-105"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:border-orange-300 hover:bg-orange-50/50"
                  }`}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl bg-orange-50 border border-orange-200 p-4 text-sm font-semibold text-orange-900">
            <AlertCircle className="mt-0.5 shrink-0 text-orange-600" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* CARREGAMENTO */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/60 rounded-[2.5rem] border border-slate-200/70 text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <h3 className="text-lg font-black text-slate-800">Buscando receitas...</h3>
          </div>
        )}

        {/* GRADE DE CARDS */}
        {!loading && (
          <section>
            {filteredRecipes.length === 0 ? (
              <div className="bg-white/60 rounded-[2.5rem] p-8 sm:p-12 text-center border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  {hasSearched ? "Nenhuma receita encontrada" : "Explore milhares de receitas"}
                </h3>
                <p className="text-slate-400 font-medium text-xs max-w-sm mx-auto mt-1.5">
                  {hasSearched
                    ? "Tente outro termo ou altere os filtros acima."
                    : "Pesquise pelo nome de um prato ou selecione seus ingredientes."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
                {filteredRecipes.map((recipe) => {
                  const isCanMake = recipe.status === "can_make";
                  const isMissing = recipe.status === "missing_some";

                  return (
                    <Card key={recipe.idMeal} onClick={() => handleOpenRecipe(recipe)}
                      className="group overflow-hidden rounded-[2rem] border-transparent bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgb(249,115,22,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">

                      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                        <img src={recipe.strMealThumb} alt={recipe.strMealPt || recipe.strMeal}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-white/20">
                          🌍 {recipe.strAreaPt || recipe.strArea}
                        </span>
                        {recipe.status && (
                          <div className="absolute top-3 right-3">
                            {isCanMake && (
                              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <CheckCircle2 size={12} /> Posso Fazer
                              </span>
                            )}
                            {isMissing && (
                              <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <AlertTriangle size={12} /> Faltam Itens
                              </span>
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-black">
                          <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20 text-[10px] uppercase tracking-wider">
                            {recipe.strCategoryPt || recipe.strCategory}
                          </span>
                          <span className="text-[11px] font-bold text-white/90">
                            {recipe.ingredients?.length || 0} ingredientes
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="font-black text-slate-800 text-base sm:text-lg leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                            {recipe.strMealPt || recipe.strMeal}
                          </h4>
                          {activeMode === "pantry" && recipe.totalRequiredCount !== undefined && (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                              <div className="flex justify-between text-[11px] font-black text-slate-600">
                                <span>Você possui:</span>
                                <span className={isCanMake ? "text-emerald-600" : "text-orange-600"}>
                                  {recipe.matchedCount}/{recipe.totalRequiredCount} ({recipe.matchPercentage}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div className={`h-full rounded-full ${isCanMake ? "bg-emerald-500" : isMissing ? "bg-amber-500" : "bg-red-400"}`}
                                  style={{ width: `${recipe.matchPercentage}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button type="button" className="w-full h-11 bg-slate-900 group-hover:bg-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all">
                          Ver Receita <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL DETALHES DA RECEITA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="h-full sm:h-auto max-h-[100vh] sm:max-h-[92vh] w-full sm:max-w-3xl overflow-hidden rounded-none sm:rounded-[2.5rem] border-none bg-white p-0 shadow-2xl flex flex-col">
          {selectedRecipe && (
            <>
              {/* Header com foto */}
              <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-900 shrink-0">
                <img src={selectedRecipe.strMealThumb} alt={selectedRecipe.strMealPt || selectedRecipe.strMeal}
                  className="h-full w-full object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition">
                  <X size={20} />
                </button>
                <div className="absolute bottom-5 left-5 right-5 sm:left-6 sm:right-6 text-white space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      {selectedRecipe.strCategoryPt || selectedRecipe.strCategory}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20">
                      🌍 {selectedRecipe.strAreaPt || selectedRecipe.strArea}
                    </span>
                    {selectedRecipe.mealTypes?.filter((t) => t !== "Todas").map((t) => (
                      <span key={t} className="bg-slate-800/80 text-orange-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight pt-1">
                    {selectedRecipe.strMealPt || selectedRecipe.strMeal}
                  </h2>
                </div>
              </div>

              {/* Corpo */}
              <div className="p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-7 overflow-y-auto flex-1">

                {/* Carregando detalhes */}
                {loadingDetail && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 text-orange-700 text-sm font-bold">
                    <Loader2 className="animate-spin shrink-0" size={18} />
                    Carregando detalhes da receita...
                  </div>
                )}

                {/* Alerta de sucesso */}
                {addSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                    {addSuccessMessage}
                  </div>
                )}

                {/* Ingredientes */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        <Utensils size={18} className="text-orange-500" />
                        Ingredientes
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {(selectedRecipe.ingredientsTranslated || selectedRecipe.ingredients || []).length} itens
                      </p>
                    </div>
                    <Button type="button" onClick={openAddIngredientsFlow}
                      className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md w-full sm:w-auto">
                      <Plus size={16} className="mr-1" />Criar lista com ingredientes
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(selectedRecipe.ingredientsTranslated || selectedRecipe.ingredients || []).map((ing, idx) => {
                      const ingName = ing.translated || ing.name || ing.original || "";
                      const isAvailable = selectedRecipe.availableIngredients?.some(
                        (a) => a.name?.toLowerCase() === (ing.original || ingName).toLowerCase()
                      );
                      const isMissingIng = selectedRecipe.missingIngredients?.some(
                        (m) => m.name?.toLowerCase() === (ing.original || ingName).toLowerCase()
                      );

                      return (
                        <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${isAvailable ? "bg-emerald-50/70 border-emerald-200/80 font-bold" :
                            isMissingIng ? "bg-orange-50/60 border-orange-200/80 font-semibold" :
                              "bg-slate-50 border-slate-100 font-medium"}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isAvailable ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <Check size={13} strokeWidth={3} />
                              </div>
                            ) : isMissingIng ? (
                              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                                <Store size={12} strokeWidth={2.5} />
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                            )}
                            <span className="truncate text-slate-800">{ingName}</span>
                          </div>
                          {ing.measure && (
                            <span className="bg-white/80 px-2 py-1 rounded-md text-[11px] font-black text-slate-500 shrink-0 border border-slate-200/50 whitespace-nowrap">
                              {ing.measure}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modo de Preparo */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <ChefHat size={18} className="text-orange-500" />
                    Modo de Preparo
                  </h3>
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {selectedRecipe.strInstructionsPt || selectedRecipe.strInstructions || "Instruções não disponíveis."}
                  </div>
                </div>

                {/* Links */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRecipe.strYoutube && (
                      <a href={selectedRecipe.strYoutube} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black transition-colors">
                        <Youtube size={16} /> Ver no YouTube
                      </a>
                    )}
                    {selectedRecipe.strSource && (
                      <a href={selectedRecipe.strSource} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">
                        <ExternalLink size={14} /> Fonte Original
                      </a>
                    )}
                  </div>
                  <a href={selectedRecipe.mealDbUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-600 font-bold">
                    Ver no TheMealDB <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: adicionar ingredientes faltantes a uma lista (substitui window.confirm/prompt) */}
      <Dialog open={addFlowOpen} onOpenChange={closeAddFlow}>
        <DialogContent className="w-[92vw] max-w-[440px] rounded-[2rem] sm:rounded-[2.5rem] border-none bg-white p-0 shadow-2xl overflow-hidden gap-0">
          {/* Cabeçalho com gradiente — mesmo padrão visual do restante do app */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 px-6 pt-7 pb-8 text-white sm:px-8 sm:pt-8 sm:pb-9">
            <div className="pointer-events-none absolute -right-4 -bottom-6 opacity-15">
              <ShoppingBag size={120} strokeWidth={1} />
            </div>

            <DialogHeader className="relative z-10 space-y-1.5 text-left">
              {addFlowStep !== "choose" && (
                <button
                  type="button"
                  onClick={() => setAddFlowStep("choose")}
                  disabled={addingToList}
                  className="mb-1 inline-flex w-fit items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white/80 hover:text-white disabled:opacity-50"
                >
                  <ChevronLeft size={14} strokeWidth={3} /> Voltar
                </button>
              )}
              <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                {addFlowStep === "pickList" ? <ShoppingBag size={20} strokeWidth={2.5} /> : <Sparkles size={20} strokeWidth={2.5} />}
              </div>
              <DialogTitle className="text-xl font-black italic tracking-tighter text-white drop-shadow-sm sm:text-2xl">
                {addFlowStep === "choose" && "Adicionar Ingredientes"}
                {addFlowStep === "newName" && "Nova Lista de Compras"}
                {addFlowStep === "pickList" && "Escolher Lista"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium leading-relaxed text-orange-100 sm:text-sm">
                {addFlowStep === "choose" && `Faltam ${missingCount} ingrediente(s) para essa receita. Como você quer adicionar?`}
                {addFlowStep === "newName" && "Dê um nome para a nova lista de compras."}
                {addFlowStep === "pickList" && "Selecione a lista que vai receber os ingredientes."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Corpo */}
          <div className="px-6 py-6 sm:px-8 sm:py-7">
            {addFlowStep === "choose" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setAddFlowStep("newName")}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-orange-200 bg-orange-50/60 p-4 text-left transition-colors hover:bg-orange-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-800">Criar nova lista</p>
                    <p className="text-xs font-medium text-slate-500">Uma lista nova só com esses ingredientes</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => lists.length && setAddFlowStep("pickList")}
                  disabled={!lists.length}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-800">Adicionar a uma lista existente</p>
                    <p className="text-xs font-medium text-slate-500">
                      {lists.length ? `Você tem ${lists.length} lista(s)` : "Você ainda não tem nenhuma lista"}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {addFlowStep === "newName" && (
              <div className="space-y-2.5">
                <Label htmlFor="newIngredientsListName" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nome da lista
                </Label>
                <Input
                  id="newIngredientsListName"
                  autoFocus
                  placeholder="Ex: Ingredientes da receita"
                  value={newListNameInput}
                  onChange={(e) => setNewListNameInput(e.target.value)}
                  disabled={addingToList}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-300 sm:h-14 sm:text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newListNameInput.trim() && !addingToList) {
                      handleCreateNewListWithIngredients();
                    }
                  }}
                />
              </div>
            )}

            {addFlowStep === "pickList" && (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {lists.map((list) => (
                  <button
                    key={list.id ?? list._id}
                    type="button"
                    disabled={addingToList}
                    onClick={() => handleAddToExistingList(list)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:border-orange-200 hover:bg-orange-50 disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-sm text-slate-800">{list.name}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{(list.items || []).length} ite(ns)</p>
                    </div>
                    {addingToList ? (
                      <Loader2 className="shrink-0 animate-spin text-orange-500" size={16} />
                    ) : (
                      <ArrowRight size={16} className="shrink-0 text-slate-300" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé — só na etapa de nomear a nova lista */}
          {addFlowStep === "newName" && (
            <DialogFooter className="flex-col-reverse gap-2.5 px-6 pb-6 pt-0 sm:flex-row sm:gap-3 sm:px-8 sm:pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddFlowStep("choose")}
                disabled={addingToList}
                className="h-12 w-full rounded-2xl border-slate-200 font-black text-sm text-slate-600 hover:bg-slate-50 sm:w-auto"
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleCreateNewListWithIngredients}
                disabled={!newListNameInput.trim() || addingToList}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 font-black text-sm text-white shadow-lg transition-transform hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 sm:w-auto"
              >
                {addingToList ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Criando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Criar e Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AllergenWarningPopup
        open={allergenPopupOpen}
        loading={allergenChecking}
        matches={allergenMatches}
        sourceLabel="Lista da receita"
        confirmLabel="Estou ciente, continuar"
        cancelLabel="Cancelar"
        onConfirm={() => executeAllergenConfirmedShoppingList()}
        onCancel={() => {
          setAllergenPopupOpen(false);
          setAllergenMatches([]);
        }}
      />
    </div>
  );
}