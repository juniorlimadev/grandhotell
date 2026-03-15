import { useState, useEffect } from "react";
import { usuarioApi } from "../services/api";

function toInputDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default function Usuarios() {
  const [lista, setLista] = useState({ content: [], totalElements: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    dataNascimento: toInputDate(new Date("1990-01-01")),
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async (page = 0) => {
    setLoading(true);
    try {
      const res = await usuarioApi.list(page, 10);
      setLista(res.data);
    } catch (e) {
      setErro(e.response?.data?.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar(0);
  }, []);

  const abrirNovo = () => {
    setForm({
      nome: "",
      email: "",
      senha: "",
      dataNascimento: toInputDate(new Date("1990-01-01")),
    });
    setErro("");
    setUsuarioEditando(null);
    setModalAberto(true);
  };

  const abrirEditar = (usuario) => {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
      dataNascimento: toInputDate(usuario.dataNascimento),
    });
    setErro("");
    setUsuarioEditando(usuario.idUsuario);
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      if (usuarioEditando) {
        await usuarioApi.update(usuarioEditando, form);
      } else {
        await usuarioApi.create(form);
      }
      setModalAberto(false);
      carregar(lista.page - 1);
    } catch (e) {
      setErro(e.response?.data?.message || "Erro ao salvar. Verifique e-mail único e dados.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (idUsuario) => {
    if (!window.confirm("Excluir este usuário?")) return;
    try {
      await usuarioApi.delete(idUsuario);
      carregar(lista.page - 1);
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestão de Usuários</h2>
          <p className="text-slate-500 dark:text-slate-400">Cadastro de usuários do sistema</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Nome</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">E-mail</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Nascimento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Carregando...</td>
              </tr>
            ) : (lista.content || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum usuário cadastrado.</td>
              </tr>
            ) : (
              (lista.content || []).map((u) => (
                <tr key={u.idUsuario} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-bold">{u.nome}</td>
                  <td className="px-6 py-4 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-sm">{u.dataNascimento ? toInputDate(u.dataNascimento) : "—"}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(u)}
                      className="text-primary hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.idUsuario)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total: {lista.totalElements ?? 0} usuários</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={lista.page <= 1}
              onClick={() => carregar(lista.page - 2)}
              className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={lista.page >= (lista.totalPages || 1)}
              onClick={() => carregar(lista.page)}
              className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{usuarioEditando ? "Editar usuário" : "Novo usuário"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required={!usuarioEditando}
                  placeholder={usuarioEditando ? "Deixe em branco para manter" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de nascimento</label>
                <input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              {erro && <p className="text-sm text-red-500">{erro}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-95 disabled:opacity-70">
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
