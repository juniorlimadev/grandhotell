import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { quartoApi } from "../services/api";
import { toast } from "react-toastify";

const ALAS = ["ALTA", "MEDIA", "BAIXA"];

export default function Quartos() {
  const [lista, setLista] = useState({ content: [], totalElements: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", alaHotel: "MEDIA", valorDiaria: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = !!id && id !== "novo";

  const carregar = async (page = 0) => {
    setLoading(true);
    try {
      const res = await quartoApi.list(page, 10);
      setLista(res.data);
      if (isEdicao && id) {
        const { data } = await quartoApi.getById(id);
        const q = data.Quarto || data;
        setForm({ 
          nome: q.nome || "", 
          alaHotel: q.alaHotel || "MEDIA",
          valorDiaria: q.valorDiaria || "" 
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao carregar quartos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdicao && id) {
      setModalAberto(true);
      quartoApi.getById(id).then(({ data }) => {
        const q = data.Quarto || data;
        setForm({ 
          nome: q.nome || "", 
          alaHotel: q.alaHotel || "MEDIA",
          valorDiaria: q.valorDiaria || ""
        });
      }).catch(() => setErro("Quarto não encontrado."));
    }
    carregar(isEdicao ? undefined : 0);
  }, [id, isEdicao]);

  const abrirNovo = () => {
    setForm({ nome: "", alaHotel: "MEDIA", valorDiaria: "" });
    setErro("");
    setModalAberto(true);
    navigate("/quartos/novo", { replace: true });
  };

  const fecharModal = () => {
    setModalAberto(false);
    setErro("");
    navigate("/quartos");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      if (isEdicao) {
        await quartoApi.update(id, form);
        toast.success("Quarto atualizado com sucesso!");
      } else {
        await quartoApi.create(form);
        toast.success("Quarto criado com sucesso!");
      }
      fecharModal();
      carregar(lista.page - 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (idQuarto) => {
    if (!window.confirm("Deseja realmente excluir este quarto?")) return;
    try {
      await quartoApi.delete(idQuarto);
      toast.success("Quarto excluído com sucesso!");
      carregar(lista.page - 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao excluir quarto.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestão de Quartos</h2>
          <p className="text-slate-500 dark:text-slate-400">Cadastro e listagem de quartos</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Adicionar Quarto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Quarto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ala</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Valor Diária</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Carregando...</td>
              </tr>
            ) : (lista.content || []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Nenhum quarto cadastrado.</td>
              </tr>
            ) : (
              (lista.content || []).map((q) => (
                <tr key={q.idQuarto} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-bold">{q.nome}</td>
                  <td className="px-6 py-4 text-sm">{q.alaHotel || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                    {q.valorDiaria ? q.valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "—"}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link
                      to={`/quartos/${q.idQuarto}`}
                      className="text-primary hover:underline text-sm"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.idQuarto)}
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
          <span className="text-sm text-slate-500">
            Total: {lista.totalElements ?? 0} quartos
          </span>
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
            <h3 className="text-xl font-bold mb-4">{isEdicao ? "Editar quarto" : "Novo quarto"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  maxLength={25}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ala</label>
                <select
                  value={form.alaHotel}
                  onChange={(e) => setForm((f) => ({ ...f, alaHotel: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {ALAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da Diária (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valorDiaria}
                  onChange={(e) => setForm((f) => ({ ...f, valorDiaria: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={fecharModal} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
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
