import { useState, useEffect } from "react";
import { usuarioApi } from "../services/api";
import { toast } from "react-toastify";

function toInputDate(d) {
  if (!d) return "";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDate(d) {
  if (!d) return "";
  try {
    if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
      const [day, month, year] = d.split("-");
      return `${day}/${month}/${year}`;
    }
    const date = typeof d === "string" ? (d.includes(" ") ? new Date(d.split(" ")[0]) : new Date(d)) : d;
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
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
    cargos: [],
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async (page = 0) => {
    setLoading(true);
    try {
      const res = await usuarioApi.list(page, 10);
      setLista(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar(0);
  }, []);

  const permissoesDisponiveis = [
    { id: "USER", label: "Acesso Básico" },
    { id: "ADMIN", label: "Gestão de Usuários" },
    { id: "GESTAO_QUARTOS", label: "Gestão de Quartos" },
    { id: "GESTAO_RESERVAS", label: "Gestão de Reservas" },
  ];

  const handleToggleCargo = (cargoId) => {
    setForm(f => {
      const exists = f.cargos.includes(cargoId);
      if (exists) {
        return { ...f, cargos: f.cargos.filter(id => id !== cargoId) };
      } else {
        return { ...f, cargos: [...f.cargos, cargoId] };
      }
    });
  };

  const abrirNovo = () => {
    setForm({
      nome: "",
      email: "",
      senha: "",
      dataNascimento: toInputDate(new Date("1990-01-01")),
      cargos: ["USER"],
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
      cargos: Array.isArray(usuario.cargos) ? usuario.cargos : [],
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
      const payload = { ...form };
      if (usuarioEditando && !payload.senha) {
        delete payload.senha;
      }
      
      if (usuarioEditando) {
        await usuarioApi.update(usuarioEditando, payload);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await usuarioApi.create(payload);
        toast.success("Usuário criado com sucesso!");
      }
      setModalAberto(false);
      carregar(lista.page - 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao salvar. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  };


  const handleDelete = async (idUsuario) => {
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;
    try {
      await usuarioApi.delete(idUsuario);
      toast.success("Usuário excluído com sucesso!");
      carregar(lista.page - 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao excluir usuário.");
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
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Nome / E-mail</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Permissões</th>
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
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{u.nome}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.cargos?.map(c => (
                        <span key={c} className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                          c === 'ADMIN' ? 'bg-red-100 text-red-600' :
                          c === 'GESTAO_QUARTOS' ? 'bg-emerald-100 text-emerald-600' :
                          c === 'GESTAO_RESERVAS' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {c.replace('GESTAO_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.dataNascimento)}</td>

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
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permissões de Acesso</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  {permissoesDisponiveis.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={form.cargos.includes(p.id)}
                        onChange={() => handleToggleCargo(p.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de nascimento</label>
                <input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

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
