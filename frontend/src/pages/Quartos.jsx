import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { quartoApi } from "../services/api";
import { toast } from "react-toastify";

const ALAS = ["ALTA", "MEDIA", "BAIXA"];

export default function Quartos() {
  const [lista, setLista] = useState({ content: [], totalElements: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ 
    nome: "", 
    alaHotel: "MEDIA", 
    valorDiaria: "",
    descricao: "",
    fotoUrl: "",
    avaliacao: 5.0,
    tipo: "Suíte",
    tags: "Wi-Fi, Piscina, Ar"
  });

  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [sortField, setSortField] = useState("nome");
  const [sortDir, setSortDir] = useState("ASC");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = !!id && id !== "novo";

  const carregar = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const res = await quartoApi.list(page, 10, sortField, sortDir);
      setLista(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao carregar quartos.");
    } finally {
      setLoading(false);
    }
  }, [sortField, sortDir]);

  const quartosFiltrados = (lista.content || []).filter(q => 
    q.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    q.tipo?.toLowerCase().includes(busca.toLowerCase())
  );

  useEffect(() => {
    carregar(0);
    if (isEdicao && id) {
      setModalAberto(true);
      quartoApi
        .getById(id)
        .then(({ data }) => {
          const q = data.Quarto || data;
          setForm({
            nome: q.nome || "",
            alaHotel: q.alaHotel || "MEDIA",
            valorDiaria: q.valorDiaria || "",
            descricao: q.descricao || "",
            fotoUrl: q.fotoUrl || "",
            avaliacao: q.avaliacao || 5.0,
            tipo: q.tipo || "Suíte",
            tags: q.tags || ""
          });
        })
        .catch(() => toast.error("Quarto não encontrado."));
    }
  }, [carregar, id, isEdicao]);

  const abrirNovo = () => {
    setForm({ 
      nome: "", 
      alaHotel: "MEDIA", 
      valorDiaria: "",
      descricao: "",
      fotoUrl: "",
      avaliacao: 5.0,
      tipo: "Suíte",
      tags: "Wi-Fi, Piscina, Ar"
    });
    setModalAberto(true);
    navigate("/admin/quartos/novo", { replace: true });
  };

  const fecharModal = () => {
    setModalAberto(false);
    navigate("/admin/quartos");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-xl text-sm font-bold hover:brightness-95 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Adicionar Quarto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-6 items-center shadow-sm">
        <div className="flex-1 min-w-[250px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            placeholder="Pesquisar por nome ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">sort</span>
          <select 
            value={`${sortField}-${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-");
              setSortField(field);
              setSortDir(dir);
            }}
            className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 cursor-pointer"
          >
            <option value="idQuarto-DESC">Últimos Criados</option>
            <option value="nome-ASC">Nome (A-Z)</option>
            <option value="nome-DESC">Nome (Z-A)</option>
            <option value="valorDiaria-ASC">Menor Preço</option>
            <option value="valorDiaria-DESC">Maior Preço</option>
          </select>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Quarto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Valor Diária</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Carregando...</td>
              </tr>
            ) : quartosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum quarto encontrado.</td>
              </tr>
            ) : (
              quartosFiltrados.map((q) => (

                <tr key={q.idQuarto} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {q.fotoUrl ? (
                         <img src={q.fotoUrl} alt={q.nome} className="size-full object-cover" />
                      ) : (
                         <div className="size-full flex items-center justify-center text-slate-300">
                           <span className="material-symbols-outlined">bed</span>
                         </div>
                      )}
                    </div>
                    <span className="font-bold">{q.nome}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{q.tipo || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                    {q.valorDiaria ? q.valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "—"}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link
                      to={`/admin/quartos/${q.idQuarto}`}
                      className="text-primary hover:underline text-sm font-bold"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.idQuarto)}
                      className="text-red-500 hover:underline text-sm font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 w-full max-w-2xl shadow-2xl my-auto">
            <h3 className="text-2xl font-black mb-6">{isEdicao ? "Editar Quarto" : "Cadastrar Novo Quarto"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome do Quarto</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                      required
                      maxLength={25}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tipo / Categoria</label>
                    <input
                      type="text"
                      value={form.tipo}
                      onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Ex: Suíte Master, Executivo"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ala do Hotel</label>
                    <select
                      value={form.alaHotel}
                      onChange={(e) => setForm((f) => ({ ...f, alaHotel: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                    >
                      {ALAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor da Diária (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.valorDiaria}
                      onChange={(e) => setForm((f) => ({ ...f, valorDiaria: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                      required
                      placeholder="0.00"
                    />
                  </div>
              </div>

              <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">URL da Imagem</label>
                    <input
                      type="text"
                      value={form.fotoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, fotoUrl: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm"
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Avaliação (1-5 estrelas)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={form.avaliacao}
                      onChange={(e) => setForm((f) => ({ ...f, avaliacao: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Facilidades (Tags)</label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Ex: Wi-Fi, Piscina, Ar"
                    />
                  </div>
              </div>

              <div className="col-span-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descrição Detalhada</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all min-h-[100px] resize-none text-sm"
                  placeholder="Escreva sobre o conforto, vista e detalhes do quarto..."
                />
              </div>

              <div className="col-span-full flex gap-3 justify-end mt-4">
                <button type="button" onClick={fecharModal} className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-8 py-3 bg-primary text-slate-900 font-black rounded-2xl hover:brightness-95 disabled:opacity-70 shadow-lg shadow-primary/20 transition-all active:scale-95">
                  {salvando ? "Processando..." : (isEdicao ? "Salvar Alterações" : "Cadastrar Quarto")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
