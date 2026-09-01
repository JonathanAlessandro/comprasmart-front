import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

export function RegisterForm() {
  // Estados para capturar os dados do novo usuário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para exibir erros e controle de carregamento
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Função chamada ao clicar em "Criar conta"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post("/user", {
        user_name: name,
        user_email: email,
        user_password: password,
      });

      const { data: loginData } = await api.post("/login", {
        user_email: email,
        user_password: password,
      });

      if (!loginData?.accessToken) {
        setError("A conta foi criada, mas o servidor não retornou um token válido.");
        return;
      }

      const userName = loginData.user?.user_name || name;
      const userEmail = loginData.user?.user_email || email;
      login(loginData.accessToken, userName, userEmail);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Erro de conexão com o servidor. Verifique se o backend está ativo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mensagem de erro amigável */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* Campo para o Nome Completo */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium leading-none">
          Nome
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Campo para o E-mail */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium leading-none">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          placeholder="exemplo@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Campo para escolher a Senha */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium leading-none">
          Senha
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Ex: Senha@123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-[11px] text-gray-500">
          Mínimo de 8 caracteres, contendo maiúscula, minúscula, número e símbolo (@$!%*?&).
        </p>
      </div>

      {/* Botão de Finalizar Cadastro */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Criando conta..." : "Criar conta"}
      </Button>

      {/* Link de volta para a tela de Login */}
      <div className="mt-4 text-center text-sm">
        Já tem uma conta?{" "}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Entrar
        </Link>
      </div>
    </form>
  );
}
