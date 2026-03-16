import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (login, senha) => api.post("/auth", { login, senha }),
};

export const quartoApi = {
  list: (page = 0, size = 10, sort = "nome", sortDirection = "ASC") =>
    api.get("/quarto", { params: { page, size, sort, sortDirection } }),
  getById: (id) => api.get(`/quarto/${id}`),
  create: (data) => api.post("/quarto", data),
  update: (id, data) => api.put(`/quarto/${id}`, data),
  delete: (id) => api.delete(`/quarto/${id}`),
};

function toBackendDate(value) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value + "T12:00:00") : value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export const reservaApi = {
  quartosLivres: (page = 0, size = 10, dtInicio, dtFim, ala, sortField = "nome", sortDirection = "ASC") =>
    api.get("/reserva/quartos-livres", {
      params: { page, size, dtInicio: toBackendDate(dtInicio), dtFim: toBackendDate(dtFim), ala, sortField, sortDirection },
    }),
  quartosOcupados: (dtInicio, dtFim) =>
    api.get("/reserva/quartos-ocupados", {
      params: { dtInicio: toBackendDate(dtInicio), dtFim: toBackendDate(dtFim) },
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
    }),
  update: (id, data) =>
    api.put(`/reserva/${id}`, {
      idUsuario: data.idUsuario,
      idQuarto: data.idQuarto,
      dtInicio: toBackendDate(data.dtInicio),
      dtFim: toBackendDate(data.dtFim),
      hospedeNome: data.hospedeNome,
      observacoes: data.observacoes,
    }),
  delete: (id) => api.delete(`/reserva/${id}`),
};

export const usuarioApi = {
  list: (page = 0, size = 10, sort = "nome") =>
    api.get("/usuario", { params: { page, size, sort } }),
  getById: (id) => api.get(`/usuario/${id}`),
  create: (data) => {
    const d = { ...data };
    if (d.dataNascimento && typeof d.dataNascimento === "string" && d.dataNascimento.length === 10) {
      const [y, m, day] = d.dataNascimento.split("-");
      d.dataNascimento = `${day}-${m}-${y}`;
    }
    return api.post("/usuario", d);
  },
  update: (id, data) => {
    const d = { ...data };
    if (d.dataNascimento && typeof d.dataNascimento === "string" && d.dataNascimento.length === 10) {
      const [y, m, day] = d.dataNascimento.split("-");
      d.dataNascimento = `${day}-${m}-${y}`;
    }
    return api.put(`/usuario/${id}`, d);
  },
  delete: (id) => api.delete(`/usuario/${id}`),
  mudarSenha: (id, data) => api.put(`/usuario/mudar-senha/${id}`, data),
};

