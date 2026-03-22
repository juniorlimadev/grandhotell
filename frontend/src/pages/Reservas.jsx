import { useState, useEffect, useMemo } from "react";
import { reservaApi, quartoApi, usuarioApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate, formatDate } from "../utils/date-utils";
import ConfirmModal from "../components/ConfirmModal";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
registerLocale("pt-BR", ptBR);


export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState({ open: false, data: null });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [reservaAtualId, setReservaAtualId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });
  
  const [form, setForm] = useState({
    idUsuario: "",
    idQuarto: "",
    dtInicio: toInputDate(new Date()),
    dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
    hospedeNome: "",
    observacoes: "",
    acompanhantes: "",
    formaPagamento: "CARTAO",
    valorDeposito: 0,
    tarifaAplicada: 0,
    placaVeiculo: "",
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
          const placa = (r.placaVeiculo || "").toLowerCase();
          return nomeHospede.includes(termo) || nomeUsuario.includes(termo) || id.includes(termo) || placa.includes(termo);
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
          reservaApi.quartosOcupados(toInputDate(new Date()), toInputDate(new Date(Date.now() + 60 * 24 * 3600 * 1000))),
          usuarioApi.list(0, 500, "nome", false, "CLIENTE"), // Carrega apenas CLIENTES para associar
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
      idUsuario: "",
      idQuarto: "",
      dtInicio: toInputDate(new Date()),
      dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
      hospedeNome: "",
      observacoes: "",
      acompanhantes: "",
      formaPagamento: "CARTAO",
      valorDeposito: 0,
      tarifaAplicada: 0,
      placaVeiculo: "",
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
      acompanhantes: r.acompanhantes || "",
      formaPagamento: r.formaPagamento || "CARTAO",
      valorDeposito: r.valorDeposito || 0,
      tarifaAplicada: r.tarifaAplicada || 0,
      placaVeiculo: r.placaVeiculo || "",
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
        acompanhantes: form.acompanhantes,
        formaPagamento: form.formaPagamento,
        valorDeposito: Number(form.valorDeposito),
        tarifaAplicada: Number(form.tarifaAplicada),
        placaVeiculo: form.placaVeiculo,
      };

      if (modoEdicao) {
        await reservaApi.update(reservaAtualId, data);
        toast.success("Hospedagem atualizada com sucesso!");
      } else {
        await reservaApi.create(data);
        toast.success("Check-in/Reserva criada com sucesso!");
      }
      setModalAberto(false);
      carregarReservas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao processar registro.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (idReserva) => {
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
                        onClick={() => setModalDetalhes({ open: true, data: r })}
                        className="text-xs font-bold text-primary hover:brightness-90 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Detalhes
                      </button>
                      <button
                        onClick={() => abrirEdicao(r)}
                        className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmCancel({ open: true, id: r.idReserva })}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 w-full max-w-4xl shadow-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col h-[90vh]">
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-primary rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-3xl">hotel_class</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{modoEdicao ? `Hospedagem #${reservaAtualId}` : "Novo Registro de Hospedagem"}</h3>
                    <p className="text-sm text-slate-500 font-medium italic">Cruzamento de hóspede, unidade e dados financeiros.</p>
                  </div>
                </div>
                <button onClick={() => setModalAberto(false)} className="size-12 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Seção 1: Identificação e Datas */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                    <span className="size-1.5 bg-primary rounded-full" /> 01. Identificação da Estadia
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Responsável Legal</label>
                        </div>
                        <select
                          value={form.idUsuario}
                          onChange={(e) => {
                            const val = e.target.value;
                            const userObj = usuarios.find(u => String(u.idUsuario) === val);
                            setForm((f) => ({ 
                              ...f, 
                              idUsuario: val,
                              hospedeNome: userObj ? userObj.nome : f.hospedeNome 
                            }));
                          }}
                          className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                          required
                        >
                          <option value="">Selecione na base de clientes...</option>
                          {usuarios.map((u) => (
                            <option key={u.idUsuario} value={u.idUsuario}>{u.nome} ({u.documento || "Sem CPF"})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo (Check-in)</label>
                        <input required type="text" value={form.hospedeNome} onChange={e => setForm({...form, hospedeNome: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary" placeholder="Nome que constará na ficha" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidade Habitacional (Quarto)</label>
                          <select value={form.idQuarto} onChange={e => setForm({...form, idQuarto: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary" required>
                            <option value="">Selecione o quarto...</option>
                            {quartos.map(q => <option key={q.idQuarto} value={q.idQuarto}>{q.nome} - {q.tipo}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Entrada Prevista</label>
                          <DatePicker
                            selected={form.dtInicio ? new Date(toInputDate(form.dtInicio) + "T12:00:00") : null}
                            onChange={(date) => setForm({ ...form, dtInicio: toInputDate(date) })}
                            minDate={new Date()}
                            dateFormat="dd/MM/yyyy"
                            locale="pt-BR"
                            className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary"
                            placeholderText="Selecione data"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Saída Prevista</label>
                          <DatePicker
                             selected={form.dtFim ? new Date(toInputDate(form.dtFim) + "T12:00:00") : null}
                             onChange={(date) => setForm({ ...form, dtFim: toInputDate(date) })}
                             minDate={form.dtInicio ? new Date(toInputDate(form.dtInicio) + "T12:00:00") : new Date()}
                             dateFormat="dd/MM/yyyy"
                             locale="pt-BR"
                             className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary"
                             placeholderText="Selecione data"
                             dayClassName={(date) => {
                                const dateStr = toInputDate(date);
                                const isOccupied = quartoSelecionadoReservas.some(r => {
                                   const start = toInputDate(r.dtInicio);
                                   const end = toInputDate(r.dtFim);
                                   return dateStr >= start && dateStr <= end;
                                });
                                return isOccupied ? "text-red-500 font-black decoration-red-500 underline" : "";
                             }}
                          />
                        </div>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Acompanhantes */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                    <span className="size-1.5 bg-primary rounded-full" /> 02. Acompanhantes
                  </h4>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">group</span>
                        Nomes e Documentos dos Acompanhantes
                    </label>
                    <textarea 
                      value={form.acompanhantes}
                      onChange={e => setForm({...form, acompanhantes: e.target.value})}
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl text-sm min-h-[120px] focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Ex: João Silva (CPF: 000.000...), Maria Souza (RG: ...)"
                    />
                    <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase italic">* Exigência da Ficha Nacional de Registro de Hóspedes (FNRH)</p>
                  </div>
                </div>

                {/* Seção 3: Financeiro e Veículo */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                    <span className="size-1.5 bg-primary rounded-full" /> 03. Financeiro e Segurança
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Forma de Pagamento</label>
                      <select value={form.formaPagamento} onChange={e => setForm({...form, formaPagamento: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary">
                        <option value="CARTAO">Cartão de Crédito/Débito</option>
                        <option value="PIX">PIX (Instantâneo)</option>
                        <option value="DINHEIRO">Dinheiro / Espécie</option>
                        <option value="TRANSFERENCIA">Transferência Bancária</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Sinal / Depósito (R$)</label>
                      <input type="number" step="0.01" value={form.valorDeposito} onChange={e => setForm({...form, valorDeposito: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tarifa Especial (R$)</label>
                      <input type="number" step="0.01" value={form.tarifaAplicada} onChange={e => setForm({...form, tarifaAplicada: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary" placeholder="Valor fixo se houver" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                     <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Placa do Veículo</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">directions_car</span>
                          <input type="text" value={form.placaVeiculo} onChange={e => setForm({...form, placaVeiculo: e.target.value})} className="w-full pl-12 pr-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary uppercase" placeholder="ABC-1234" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Desejos / Observações</label>
                        <input type="text" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary" placeholder="Ex: Cama extra, vista mar..." />
                     </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/30 dark:bg-slate-800/20">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-4 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                   Manter no Rascunho
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={salvando} 
                  className="flex-[2] py-4 px-6 bg-primary text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {salvando ? "Processando..." : (modoEdicao ? "Atualizar Hospedagem" : "Confirmar e Registrar")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDetalhes.open && modalDetalhes.data && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                       <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined text-4xl">receipt_long</span>
                       </div>
                       <div>
                          <h3 className="text-2xl font-black">Detalhes da Estadia</h3>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest tracking-tighter">Reserva #{modalDetalhes.data.idReserva}</p>
                       </div>
                    </div>
                    <button onClick={() => setModalDetalhes({ open: false, data: null })} className="size-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                       <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hóspede Principal</p>
                       <p className="text-lg font-black">{modalDetalhes.data.hospedeNome}</p>
                       <p className="text-xs text-slate-500 font-medium italic">Responsável financeiro</p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acomodação</p>
                       <p className="text-lg font-black">{modalDetalhes.data.quartoNome}</p>
                       <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-primary tracking-widest">Check-in Confirmado</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                       <span className="size-1.5 bg-primary rounded-full" /> Fluxo da Estadia (Timeline)
                    </h4>
                    
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                       <div className="relative">
                          <div className={`absolute -left-8 size-6 rounded-full border-4 border-white dark:border-slate-900 ${modalDetalhes.data.dtInicio ? 'bg-primary' : 'bg-slate-200'}`} />
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-black uppercase tracking-wider">Reserva Criada</p>
                                <span className="text-[10px] font-bold text-slate-400 italic">Previsão: {formatDate(modalDetalhes.data.dtInicio)}</span>
                             </div>
                             <p className="text-[11px] text-slate-500 font-medium">Estadia programada. Todos os dados iniciais foram validados.</p>
                          </div>
                       </div>

                       <div className="relative">
                          <div className={`absolute -left-8 size-6 rounded-full border-4 border-white dark:border-slate-900 ${modalDetalhes.data.checkinReal ? 'bg-green-500' : 'bg-slate-200'}`} />
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-black uppercase tracking-wider">Entrada (Check-in)</p>
                                <span className="text-[10px] font-bold text-slate-400 italic">{modalDetalhes.data.checkinReal ? new Date(modalDetalhes.data.checkinReal).toLocaleString() : 'Pendente'}</span>
                             </div>
                             <p className="text-[11px] text-slate-500 font-medium">Liberação do quarto e confirmação presencial da identidade do hóspede.</p>
                          </div>
                       </div>

                       <div className="relative">
                          <div className={`absolute -left-8 size-6 rounded-full border-4 border-white dark:border-slate-900 ${modalDetalhes.data.checkoutReal ? 'bg-amber-500' : 'bg-slate-200'}`} />
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-black uppercase tracking-wider">Saída (Check-out)</p>
                                <span className="text-[10px] font-bold text-slate-400 italic">{modalDetalhes.data.checkoutReal ? new Date(modalDetalhes.data.checkoutReal).toLocaleString() : 'Aguardando encerramento'}</span>
                             </div>
                             <p className="text-[11px] text-slate-500 font-medium">Encerramento da conta e devolução das chaves. O quarto passará para limpeza.</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-10 p-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Estimado</p>
                       <p className="text-xl font-black italic">R$ {((Number(modalDetalhes.data.valorDiaria) || 0) + (Number(modalDetalhes.data.consumoExtra) || 0)).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-bold">{modalDetalhes.data.formaPagamento || 'CARTÃO'}</p>
                       <p className="text-[10px] text-primary font-black uppercase">Pagamento Registrado</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, id: null })}
        onConfirm={() => handleDelete(confirmCancel.id)}
        title="Cancelar Reserva?"
        message="Esta ação é definitiva e removerá a reserva do sistema permanentemente. Deseja prosseguir?"
        confirmText="Sim, Cancelar"
        cancelText="Não, Manter"
      />
    </div>
  );
}
