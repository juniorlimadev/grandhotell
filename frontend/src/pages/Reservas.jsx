import { useState, useEffect, useMemo } from "react";
import { reservaApi, quartoApi, usuarioApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate, formatDate } from "../utils/date-utils";


export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [reservaAtualId, setReservaAtualId] = useState(null);
  
  const [form, setForm] = useState({
    idUsuario: "",
    idQuarto: "",
    dtInicio: toInputDate(new Date()),
    dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
    hospedeNome: "",
    observacoes: "",
  });

  const [quartoSelecionadoReservas, setQuartoSelecionadoReservas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [dtInicio, setDtInicio] = useState(toInputDate(new Date()));
  const [dtFim, setDtFim] = useState(toInputDate(new Date(Date.now() + 30 * 24 * 3600 * 1000)));
  const [busca, setBusca] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc, asc
  const [sortField, setSortField] = useState("id"); // id, nome, data

  const carregarReservas = async () => {
    try {
      const res = await reservaApi.quartosOcupados(dtInicio, dtFim);
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReservas([]);
    }
  };

  // Aplica filtro e ordenação em memória apenas quando dependências mudam
  const reservasFiltradas = useMemo(
    () =>
      reservas
        .filter((r) => {
          const termo = busca.toLowerCase();
          const nomeHospede = (r.hospedeNome || "").toLowerCase();
          const nomeUsuario = (r.usuario?.nome || "").toLowerCase();
          const id = String(r.idReserva);
          return nomeHospede.includes(termo) || nomeUsuario.includes(termo) || id.includes(termo);
        })
        .sort((a, b) => {
          if (sortField === "id") {
            return sortOrder === "asc" ? a.idReserva - b.idReserva : b.idReserva - a.idReserva;
          }
          if (sortField === "nome") {
            const nomeA = (a.hospedeNome || a.usuario?.nome || "").toLowerCase();
            const nomeB = (b.hospedeNome || b.usuario?.nome || "").toLowerCase();
            return sortOrder === "asc" ? nomeA.localeCompare(nomeB) : nomeB.localeCompare(nomeA);
          }
          if (sortField === "data") {
            const dataA = new Date(a.dtInicio);
            const dataB = new Date(b.dtInicio);
            return sortOrder === "asc" ? dataA - dataB : dataB - dataA;
          }
          return 0;
        }),
    [reservas, busca, sortField, sortOrder]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [rRes, uRes, qRes] = await Promise.all([
          reservaApi.quartosOcupados(dtInicio, dtFim),
          usuarioApi.list(0, 100),
          quartoApi.list(0, 100)
        ]);
        if (!cancelled) {
          setReservas(Array.isArray(rRes.data) ? rRes.data : []);
          setUsuarios(uRes.data?.content || []);
          setQuartos(qRes.data?.content || []);
        }
      } catch {
        if (!cancelled) setReservas([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dtInicio, dtFim]);

  useEffect(() => {
    if (form.idQuarto) {
      const start = toInputDate(new Date());
      const end = toInputDate(new Date(Date.now() + 90 * 24 * 3600 * 1000));
      reservaApi.quartosOcupados(start, end).then(r => {
        const filtered = r.data.filter(reserva => reserva.idQuarto === Number(form.idQuarto) && reserva.idReserva !== reservaAtualId);
        setQuartoSelecionadoReservas(filtered);
      }).catch(() => setQuartoSelecionadoReservas([]));
    } else {
      setQuartoSelecionadoReservas([]);
    }
  }, [form.idQuarto, reservaAtualId]);

  const abrirNovo = () => {
    setModoEdicao(false);
    setReservaAtualId(null);
    setForm({
      idUsuario: usuarios[0]?.idUsuario ?? "",
      idQuarto: "",
      dtInicio: toInputDate(new Date()),
      dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
      hospedeNome: "",
      observacoes: "",
    });
    setModalAberto(true);
  };

  const abrirEdicao = (r) => {
    setModoEdicao(true);
    setReservaAtualId(r.idReserva);
    setForm({
      idUsuario: r.usuario?.idUsuario ?? r.idUsuario ?? "",
      idQuarto: r.quarto?.idQuarto ?? r.idQuarto ?? "",
      dtInicio: toInputDate(r.dtInicio),
      dtFim: toInputDate(r.dtFim),
      hospedeNome: r.hospedeNome || "",
      observacoes: r.observacoes || "",
    });
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const data = {
        idUsuario: Number(form.idUsuario),
        idQuarto: Number(form.idQuarto),
        dtInicio: form.dtInicio,
        dtFim: form.dtFim,
        hospedeNome: form.hospedeNome,
        observacoes: form.observacoes,
      };

      if (modoEdicao) {
        await reservaApi.update(reservaAtualId, data);
        toast.success("Reserva atualizada com sucesso!");
      } else {
        await reservaApi.create(data);
        toast.success("Reserva criada com sucesso!");
      }
      setModalAberto(false);
      carregarReservas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao processar reserva.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (idReserva) => {
    if (!window.confirm("Deseja realmente cancelar esta reserva?")) return;
    try {
      await reservaApi.delete(idReserva);
      toast.success("Reserva cancelada com sucesso!");
      carregarReservas();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao cancelar reserva.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Reservas</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerenciamento completo de estadias</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-xl text-sm font-bold hover:brightness-95 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Reserva
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-6 items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">calendar_month</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dtInicio}
              onChange={(e) => setDtInicio(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary"
            />
            <span className="text-slate-400 text-xs font-bold uppercase">até</span>
            <input
              type="date"
              value={dtFim}
              onChange={(e) => setDtFim(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-2 hidden lg:block"></div>

        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            placeholder="Buscar por hóspede ou #id..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">sort</span>
          <select 
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortField(field);
              setSortOrder(order);
            }}
            className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 cursor-pointer"
          >
            <option value="id-desc">Últimas (ID ↓)</option>
            <option value="id-asc">Primeiras (ID ↑)</option>
            <option value="nome-asc">Hóspede (A-Z)</option>
            <option value="nome-desc">Hóspede (Z-A)</option>
            <option value="data-desc">Mais Recentes</option>
            <option value="data-asc">Mais Antigas</option>
          </select>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Reserva</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Hóspede / Responsável</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Quarto</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estadia</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-200">event_repeat</span>
                    <p className="text-sm font-medium">Carregando mapa de reservas...</p>
                  </div>
                </td>
              </tr>
            ) : reservasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">Nenhuma reserva encontrada neste período.</td>
              </tr>
            ) : (
              reservasFiltradas.map((r) => (

                <tr key={r.idReserva} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-300 group-hover:text-primary transition-colors">#{r.idReserva}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{r.hospedeNome || r.usuario?.nome || "Não informado"}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{r.usuario?.email || "Staff"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">{r.quarto?.nome?.slice(-3) || r.idQuarto}</span>
                      <span className="text-xs font-semibold">{r.quarto?.nome || "Quarto Estiloso"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{formatDate(r.dtInicio)} - {formatDate(r.dtFim)}</span>
                      <span className="text-[10px] text-primary font-bold uppercase">Confirmada</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => abrirEdicao(r)}
                        className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(r.idReserva)}
                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl my-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black">{modoEdicao ? "Editar reserva" : "Nova reserva"}</h3>
                  <p className="text-sm text-slate-500">Preencha os dados da estadia do hóspede</p>
                </div>
                <button onClick={() => setModalAberto(false)} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável pela reserva</label>
                      <select
                        value={form.idUsuario}
                        onChange={(e) => setForm((f) => ({ ...f, idUsuario: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Selecione quem está fazendo a reserva</option>
                        {usuarios.map((u) => (
                          <option key={u.idUsuario} value={u.idUsuario}>{u.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome do Hóspede</label>
                      <input 
                        type="text"
                        value={form.hospedeNome}
                        onChange={(e) => setForm({...form, hospedeNome: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
                        placeholder="Nome para o check-in"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entrada</label>
                        <input
                          type="date"
                          value={form.dtInicio}
                          onChange={(e) => setForm((f) => ({ ...f, dtInicio: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saída</label>
                        <input
                          type="date"
                          value={form.dtFim}
                          onChange={(e) => setForm((f) => ({ ...f, dtFim: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quarto</label>
                      <select
                        value={form.idQuarto}
                        onChange={(e) => setForm((f) => ({ ...f, idQuarto: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Selecione o quarto</option>
                        {quartos.map((q) => (
                          <option key={q.idQuarto} value={q.idQuarto}>{q.nome}</option>
                        ))}
                      </select>
                      {form.idQuarto && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Disponibilidade (Próximos 90 dias)</p>
                          {quartoSelecionadoReservas.length === 0 ? (
                            <p className="text-[10px] text-green-500 font-bold uppercase">Disponível em todo período</p>
                          ) : (
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {quartoSelecionadoReservas.map(qr => (
                                <div key={qr.idReserva} className="flex justify-between text-[10px]">
                                  <span className="font-medium text-slate-500">{formatDate(qr.dtInicio)} - {formatDate(qr.dtFim)}</span>
                                  <span className="text-red-400 font-bold uppercase">Ocupado</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Desejos / Observações</label>
                      <textarea 
                        value={form.observacoes}
                        onChange={(e) => setForm({...form, observacoes: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Cama de casal, andar alto, próximo ao elevador..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-4 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvando} className="flex-[2] py-4 bg-primary text-slate-900 font-black rounded-xl hover:brightness-95 disabled:opacity-70 transition-all shadow-xl shadow-primary/20">
                    {salvando ? "Salvando..." : (modoEdicao ? "Atualizar Reserva" : "Confirmar Estadia")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
