import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  LogOut,
  Settings,
  ChevronRight,
  CreditCard,
  Moon,
  Sun,
  X,
  Type,
  Share2,
  Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const avatarColors = [
  { name: "Emerald", gradient: "from-emerald-500 to-emerald-700" },
  { name: "Blue", gradient: "from-blue-500 to-blue-700" },
  { name: "Purple", gradient: "from-purple-500 to-purple-700" },
  { name: "Pink", gradient: "from-pink-500 to-pink-700" },
  { name: "Orange", gradient: "from-orange-500 to-orange-700" },
  { name: "Teal", gradient: "from-teal-500 to-teal-700" },
  { name: "Indigo", gradient: "from-indigo-500 to-indigo-700" },
  { name: "Rose", gradient: "from-rose-500 to-rose-700" },
];

const getProfilePreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("userProfile") || "{}");
    return {
      avatar: saved.avatar || localStorage.getItem("userAvatar") || null,
      avatarColor: localStorage.getItem("avatarColor") || "Emerald",
      bio: saved.bio || "Compras mais inteligentes e economia com inteligência.",
      theme: saved.theme || localStorage.getItem("theme") || "light",
      textSize: saved.textSize || localStorage.getItem("textSize") || "normal"
    };
  } catch {
    return {
      avatar: localStorage.getItem("userAvatar") || null,
      avatarColor: localStorage.getItem("avatarColor") || "Emerald",
      bio: "Compras mais inteligentes e economia com inteligência.",
      theme: localStorage.getItem("theme") || "light",
      textSize: localStorage.getItem("textSize") || "normal"
    };
  }
};

const saveProfilePreferences = (updates = {}) => {
  const current = getProfilePreferences();
  const profile = { ...current, ...updates };
  localStorage.setItem("userProfile", JSON.stringify(profile));
  if (profile.avatar) localStorage.setItem("userAvatar", profile.avatar);
  if (profile.avatarColor) localStorage.setItem("avatarColor", profile.avatarColor);
  if (profile.bio) localStorage.setItem("userBio", profile.bio);
  if (profile.theme) localStorage.setItem("theme", profile.theme);
  if (profile.textSize) localStorage.setItem("textSize", profile.textSize);
};

export default function Profile() {
  const { userName, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [profileBio, setProfileBio] = useState(() => getProfilePreferences().bio);
  const [avatarUrl, setAvatarUrl] = useState(() => getProfilePreferences().avatar);
  const [avatarColor, setAvatarColor] = useState(() => getProfilePreferences().avatarColor);
  const [editName, setEditName] = useState(userName || "");
  const [editEmail, setEditEmail] = useState(userEmail || "");
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setAvatarUrl(base64String);
        localStorage.setItem("userAvatar", base64String);
        saveProfilePreferences({ avatar: base64String, avatarColor });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarColorChange = (colorName) => {
    setAvatarColor(colorName);
    localStorage.setItem("avatarColor", colorName);
    saveProfilePreferences({ avatar: avatarUrl, avatarColor: colorName });
  };

  const getAvatarGradient = () => {
    const color = avatarColors.find(c => c.name === avatarColor);
    return color ? color.gradient : "from-emerald-500 to-emerald-700";
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const preferredTheme = savedTheme || getProfilePreferences().theme;
    const shouldUseDark = preferredTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedTextSize = localStorage.getItem("textSize") || getProfilePreferences().textSize;
    const shouldUseLarge = savedTextSize === "large";
    setIsLargeText(shouldUseLarge);
    document.documentElement.style.fontSize = shouldUseLarge ? "110%" : "100%";

    const savedBio = localStorage.getItem("userBio") || getProfilePreferences().bio;
    setProfileBio(savedBio);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    saveProfilePreferences({ theme: nextDark ? "dark" : "light" });
  };

  const toggleTextSize = () => {
    const nextLarge = !isLargeText;
    setIsLargeText(nextLarge);
    document.documentElement.style.fontSize = nextLarge ? "110%" : "100%";
    const nextTextSize = nextLarge ? "large" : "normal";
    localStorage.setItem("textSize", nextTextSize);
    saveProfilePreferences({ textSize: nextTextSize });
  };

  const handleShareApp = async () => {
    const shareData = {
      title: "CompraSmart",
      text: "Conheça o CompraSmart e organize suas compras com inteligência.",
      url: "https://poupecesta.com.br"
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link do app copiado para a área de transferência!");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const copySiteLink = async () => {
    const url = "https://poupecesta.com.br";
    try {
      await navigator.clipboard.writeText(url);
      alert("Link do site copiado para a área de transferência!");
    } catch {
      alert("Não foi possível copiar o link neste navegador.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#02060d] pb-32 font-sans flex flex-col transition-colors duration-300">
      <div className="bg-white/90 dark:bg-[#0b0f17]/90 border-b border-slate-100 dark:border-slate-800 p-8 pt-16 text-center shadow-sm relative transition-colors duration-300 backdrop-blur-sm">
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-6 right-6 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-full hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 transition-all shadow-sm"
          aria-label="Abrir configurações"
        >
          <Settings size={20} strokeWidth={2.5} />
        </button>

        <div className="relative inline-block animate-in zoom-in duration-500">
          <div
            onClick={handleAvatarClick}
            className={`w-28 h-28 bg-gradient-to-br ${getAvatarGradient()} rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 text-white mb-5 transition-transform hover:scale-105 duration-300 rotate-3 hover:rotate-0 cursor-pointer overflow-hidden relative group`}
            title="Trocar foto de perfil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={48} strokeWidth={2.5} />
            )}
            <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Alterar</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div className="absolute bottom-4 -right-2 bg-emerald-400 border-[4px] border-white dark:border-slate-900 w-8 h-8 rounded-full shadow-sm flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
          {userName || "Configurando..."}
        </h1>
        <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-sm mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
          <Mail size={16} className="text-slate-400" /> {userEmail || "email@anonimo"}
        </div>
        <p className="mt-4 max-w-md mx-auto text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
          {profileBio}
        </p>

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.18em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => navigate("/dashboard/plans")}
            className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-[0.18em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Ver Planos
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8 mt-4">
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <div className="flex items-center gap-2.5 px-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-500">
              <CreditCard size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Sua Assinatura
            </h3>
          </div>

          <Card className="border border-slate-200/50 dark:border-slate-800/70 shadow-lg shadow-slate-900/10 rounded-[2rem] bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">
            <CardContent className="p-6 relative z-10 w-full h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Seu plano</p>
                  <h4 className="text-3xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">Gratuito</h4>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 p-3 rounded-xl">
                  <Check size={20} strokeWidth={3} />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Comece de graça e organize suas compras essenciais.</p>

              <div className="space-y-2 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Listas de compras básicas
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Controle simples de orçamento
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Checklists interativos
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 mb-5">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                  <span className="font-black">Quer mais recursos?</span> Faça upgrade para Plus ou Premium e desbloqueie comparação entre mercados, compartilhamento de listas e muito mais.
                </p>
              </div>

              <div className="space-y-2 text-[12px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between rounded-lg bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2">
                  <span className="font-semibold">Plus</span>
                  <span className="font-black text-emerald-600">Compartilhe com 2</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2">
                  <span className="font-semibold">Premium</span>
                  <span className="font-black text-emerald-600">Compartilhe com 5</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/dashboard/plans")}
                className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20"
              >
                Ver Planos
              </button>
            </CardContent>
          </Card>
        </section>

        <button
          onClick={handleShareApp}
          className="w-full flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-2xl border border-blue-100 font-black uppercase tracking-[0.18em] text-xs transition-colors"
        >
          <Share2 size={16} strokeWidth={2.5} />
          Compartilhar App
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-2xl border border-red-100 font-black uppercase tracking-[0.18em] text-xs transition-colors"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Sair do Sistema
        </button>
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSettings(false)}
          ></div>
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] sm:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Configurações</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Seu Nome</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Atualize seu nome de usuário</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Digite seu nome"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      if (editName.trim()) {
                        localStorage.setItem("userName", editName);
                        alert("Nome atualizado com sucesso!");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-[0.15em] transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Seu E-mail</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Atualize seu endereço de e-mail</p>
                  </div>
                </div>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Digite seu e-mail"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      if (editEmail.trim() && editEmail.includes("@")) {
                        localStorage.setItem("userEmail", editEmail);
                        alert("E-mail atualizado com sucesso!");
                      } else {
                        alert("Por favor, digite um e-mail válido.");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-[0.15em] transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Cor do Avatar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Escolha a cor de fundo</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleAvatarColorChange(color.name)}
                      className={`h-10 rounded-lg bg-gradient-to-br ${color.gradient} ${avatarColor === color.name ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white" : "hover:opacity-80"} transition-all`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {isDarkMode ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Modo Escuro</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ative o tema noturno</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDarkMode ? "bg-violet-600" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLargeText ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                    <Type size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Acessibilidade</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aumentar letras do app</p>
                  </div>
                </div>
                <button
                  onClick={toggleTextSize}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isLargeText ? "bg-indigo-600" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isLargeText ? "translate-x-6" : "translate-x-0"}`}></div>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Assinatura</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Texto do seu perfil</p>
                  </div>
                </div>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={3}
                  maxLength={140}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  placeholder="Escreva sua assinatura ou bio..."
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{profileBio.length}/140</span>
                  <button
                    onClick={() => {
                      const value = profileBio.trim() || "Compras mais inteligentes e economia com inteligência.";
                      setProfileBio(value);
                      saveProfilePreferences({ bio: value });
                    }}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-[0.2em] transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  navigate("/dashboard/plans");
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
                  <CreditCard size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Planos e Assinaturas</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie seu plano atual</p>
                </div>
                <ChevronRight className="ml-auto text-slate-400" size={18} />
              </button>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
