import axios from "axios";
import { toBackendDate } from "../utils/date-utils";

/**
 * Configuração central da API do Grand Hotel.
 * Define a baseURL, interceptores de requisição (Token JWT) e resposta (Erros 401).
 */
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para injetar o token JWT em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Rotas públicas que nunca devem redirecionar para login
    const rotasPublicas = ["/", "/cadastro", "/login-cliente", "/login", "/esqueci-senha"];
    const estaEmRotaPublica = rotasPublicas.some(r => window.location.pathname === r);
    
    if (err.response?.status === 401 && !estaEmRotaPublica) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/**
 * Endpoints de Autenticação
 */
export const authApi = {
  login: (login, senha) => api.post("/auth", { login, senha }),
  forgotPassword: (email) => api.post("/auth/esqueci-senha", { email }),
};

/**
 * Endpoints de Quartos
 * Gerencia a listagem e operações de CRUD básico.
 */
export const quartoApi = {
  list: (page = 0, size = 10, sort = "nome", sortDirection = "ASC") =>
    api.get("/quarto", { params: { page, size, sort, sortDirection } }),
  getById: (id) => api.get(`/quarto/${id}`),
  create: (data) => api.post("/quarto", data),
  update: (id, data) => api.put(`/quarto/${id}`, data),
  delete: (id) => api.delete(`/quarto/${id}`),
};

/**
 * Endpoints de Reservas
 * Gerencia a ocupação e disponibilidade dos quartos.
 */
export const reservaApi = {
  quartosLivres: (page = 0, size = 10, dtInicio, dtFim, ala, sortField = "nome", sortDirection = "ASC") =>
    api.get("/reserva/quartos-livres", {
      params: { 
        page, 
        size, 
        dtInicio: toBackendDate(dtInicio), 
        dtFim: toBackendDate(dtFim), 
        ala, 
        sortField, 
        sortDirection 
      },
    }),
  quartosOcupados: (dtInicio, dtFim) =>
    api.get("/reserva/quartos-ocupados", {
      params: { 
        dtInicio: toBackendDate(dtInicio), 
        dtFim: toBackendDate(dtFim) 
      },
    }),
  getById: (id) => api.get(`/reserva/${id}`),
  getByUsuario: (nome) => api.get(`/reserva/usuario/${encodeURIComponent(nome)}`),
  create: (data) =>
    api.post("/reserva", {
      idUsuario: data.idUsuario,
      idQuarto: data.idQuarto,
      dtInicio: toBackendDate(data.dtInicio),
      dtFim: toBackendDate(data.dtFim),
      hospedeNome: data.hospedeNome,
      observacoes: data.observacoes,
      acompanhantes: data.acompanhantes,
      formaPagamento: data.formaPagamento,
      valorDeposito: data.valorDeposito,
      tarifaAplicada: data.tarifaAplicada,
      placaVeiculo: data.placaVeiculo,
    }),
  update: (id, data) =>
    api.put(`/reserva/${id}`, {
      idUsuario: data.idUsuario,
      idQuarto: data.idQuarto,
      dtInicio: toBackendDate(data.dtInicio),
      dtFim: toBackendDate(data.dtFim),
      hospedeNome: data.hospedeNome,
      observacoes: data.observacoes,
      statusQuarto: data.statusQuarto,
      acompanhantes: data.acompanhantes,
      formaPagamento: data.formaPagamento,
      valorDeposito: data.valorDeposito,
      tarifaAplicada: data.tarifaAplicada,
      placaVeiculo: data.placaVeiculo,
    }),
  delete: (id) => api.delete(`/reserva/${id}`),
};

/**
 * Endpoints de Usuários
 * Gerencia acesso e permissões (Cargos).
 */
export const usuarioApi = {
  list: (page = 0, size = 10, sort = "nome", apenasStaff = false, cargo = "") =>
    api.get("/usuario", { params: { page, size, sort, apenasStaff, cargo } }),
  getById: (id) => api.get(`/usuario/${id}`),
  create: (data) => {
    const d = { ...data };
    if (d.dataNascimento) {
      d.dataNascimento = toBackendDate(d.dataNascimento);
    }
    return api.post("/usuario", d);
  },
  update: (id, data) => {
    const d = { ...data };
    if (d.dataNascimento) {
      d.dataNascimento = toBackendDate(d.dataNascimento);
    }
    return api.put(`/usuario/${id}`, d);
  },
  delete: (id) => api.delete(`/usuario/${id}`),
  mudarSenha: (id, data) => api.put(`/usuario/mudar-senha/${id}`, data),
  toggleStatus: (id) => api.put(`/usuario/toggle-status/${id}`),
  adminResetPassword: (id, novaSenha) => api.put(`/usuario/admin/mudar-senha-cliente/${id}`, { novaSenha }),
};

/**
 * Endpoints de Clientes (hóspedes)
 * Utiliza endpoint separado para cadastro público de hóspedes com cargo CLIENTE.
 */
export const clienteApi = {
  create: (data) => {
    const d = { ...data };
    if (d.dataNascimento) {
      d.dataNascimento = toBackendDate(d.dataNascimento);
    }
    return api.post("/usuario/cliente", d);
  },
};
