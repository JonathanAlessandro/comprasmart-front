import axios from "axios";

// Cria uma instância do Axios para centralizar as chamadas à API
// Assim, não precisamos repetir a URL base em todos os arquivos
const api = axios.create({
  // URL do backend Node.js/Express com MySQL
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

let refreshPromise = null;

function clearStoredSession() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  window.dispatchEvent(new Event("poupecesta:session-expired"));
}

function isSessionEndpoint(url = "") {
  return ["/login", "/login/google", "/refresh", "/logout"].some(
    (endpoint) => url.endsWith(endpoint),
  );
}

// Interceptor de Requisição: roda antes de QUALQUER chamada à API
api.interceptors.request.use(
  (config) => {
    // Busca o token de autenticação que salvamos no navegador ao fazer login
    const token = localStorage.getItem("userToken");

    if (token) {
      // Limpa aspas extras que o LocalStorage às vezes coloca no token
      const cleanToken = token.replace(/"/g, "");
      
      // Adiciona o token no cabeçalho 'Authorization' da requisição
      // O backend espera o formato "Bearer <token>"
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => {
    // Caso ocorra um erro antes mesmo de enviar a requisição
    return Promise.reject(error);
  }
);

// Quando o access token de curta duração expira, usa o cookie HttpOnly de
// refresh para obter outro token e repete a requisição original. Uma única
// renovação atende todas as chamadas que falharem ao mesmo tempo.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._sessionRetry &&
      !isSessionEndpoint(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._sessionRetry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${api.defaults.baseURL}/refresh`, {}, { withCredentials: true })
          .then(({ data }) => {
            if (!data?.accessToken) {
              throw new Error("O servidor não retornou um novo token de acesso");
            }
            localStorage.setItem("userToken", data.accessToken);
            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const accessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearStoredSession();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
