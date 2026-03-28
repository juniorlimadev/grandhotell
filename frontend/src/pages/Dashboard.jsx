import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quartoApi, reservaApi, produtoApi, consumoApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate } from "../utils/date-utils";
import { useAuth } from "../contexts/AuthContext";

const STATUS_CONFIG = {
  "OCUPADO":    { label: "Ocupado",    dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  "PENDENTE":   { label: "Pendente",   dot: "bg-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
  "CONFIRMADA": { label: "Agendado",   dot: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  "CANCELADA":  { label: "Cancelado",  dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-500/10",     text: "text-red-600 dark:text-red-400" },
  "CONCLUIDA":  { label: "Concluído",  dot: "bg-slate-400",   bg: "bg-slate-50 dark:bg-slate-800",    text: "text-slate-500" },
  "LIMPEZA":    { label: "Limpeza",    dot: "bg-blue-300",    bg: "bg-blue-50/50",                    text: "text-blue-400" },
  "AGENDADA":   { label: "Agendada",   dot: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [quartos, setQuartos] = useState([]);
  const [totalQuartos, setTotalQuartos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [reservas, setReservas] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("Inventário");

  // Filtros de Data Reais
  const [dtInicio, setDtInicio] = useState(toInputDate(new Date()));
  const [dtFim, setDtFim] = useState(toInputDate(new Date(Date.now() + 30 * 24 * 3600 * 1000)));

  // Detalhes / Comprovante / Consumo
  const [reservaDetalhe, setReservaDetalhe] = useState(null);
  const [itensConsumo, setItensConsumo] = useState([]);
  const [produtosCatalogo, setProdutosCatalogo] = useState([]);
  const [novoItem, setNovoItem] = useState({ idProduto: "", nome: "", preco: 0, metodo: "PIX" });

  const parseDate = (d) => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
      const [day, mon, yr] = d.split("-");
      return new Date(Number(yr), Number(mon) - 1, Number(day));
    }
    return new Date(d);
  };

  const statusDoQuarto = (idQuarto) => {
    // Primeiro verifica se o quarto FISICAMENTE está em limpeza ou manutenção
    const quartoObj = quartos.find(q => q.idQuarto === idQuarto);
    if (quartoObj?.statusOperacional === "LIMPEZA") return STATUS_CONFIG["LIMPEZA"];

    const hojeStr = new Date().toISOString().split('T')[0];
    const r = reservas.find(res => {
      const ini = toInputDate(res.dtInicio);
      const fim = toInputDate(res.dtFim);
      return res.idQuarto === idQuarto && ini <= hojeStr && fim >= hojeStr && res.statusQuarto !== 'CANCELADA';
    });
    if (!r) return { label: "Disponível", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" };
    
    return STATUS_CONFIG[r.statusQuarto] || STATUS_CONFIG["PENDENTE"];
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      const start = dtInicio || hoje;
      const end = dtFim || hoje;
      
      if (!dtInicio) setDtInicio(start);
      if (!dtFim) setDtFim(end);

      if (end < start) { 
        setDtFim(start); 
        return; 
      }
      const [qRes, rRes, pRes] = await Promise.all([
        quartoApi.list(page, 10, "idQuarto", "DESC"),
        reservaApi.quartosOcupados(start, end),
        produtoApi.list()
      ]);
      setQuartos(qRes.data.content || []);
      setTotalQuartos(qRes.data.totalElements || 0);
      setTotalPages(qRes.data.totalPages || 1);
      setReservas(Array.isArray(rRes.data) ? rRes.data : []);
      setProdutosCatalogo(pRes.data || []);
      if (pRes.data?.length > 0) {
        setNovoItem(prev => ({ ...prev, idProduto: pRes.data[0].idProduto, nome: pRes.data[0].nome, preco: pRes.data[0].preco }));
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, dtInicio, dtFim]);

  const handleStatusUpdate = async (reserva, novoStatus) => {
    try {
      const dateStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);

      await reservaApi.update(reserva.idReserva, {
        ...reserva,
        statusQuarto: novoStatus,
        checkinReal: novoStatus === "OCUPADO" ? dateStr : reserva.checkinReal,
        checkoutReal: novoStatus === "CONCLUIDA" ? dateStr : reserva.checkoutReal
      });

      toast.success(`Estadia ${novoStatus === "OCUPADO" ? "iniciada" : "concluída"}!`);
      if (novoStatus === "CONCLUIDA") setReservaDetalhe(null);
      loadData();
    } catch (e) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleActionReserva = async (reserva) => {
    setReservaDetalhe(reserva);
    try {
        const res = await consumoApi.listByReserva(reserva.idReserva);
        setItensConsumo(res.data || []);
    } catch (e) {
        toast.error("Erro ao carregar itens de consumo.");
    }
  };

  const handleAdicionarItem = async () => {
    if (!reservaDetalhe) return;
    try {
        await consumoApi.create({
            idReserva: reservaDetalhe.idReserva,
            idProduto: novoItem.idProduto,
            quantidade: 1
        });
        toast.success(`${novoItem.nome} adicionado!`);
        const res = await consumoApi.listByReserva(reservaDetalhe.idReserva);
        setItensConsumo(res.data);
    } catch (e) {
        toast.error("Erro ao lançar item.");
    }
  };

  const handleRemoverItem = async (idConsumo) => {
    if (!window.confirm("Deseja remover este item?")) return;
    try {
        await consumoApi.delete(idConsumo);
        toast.success("Item removido!");
        const res = await consumoApi.listByReserva(reservaDetalhe.idReserva);
        setItensConsumo(res.data);
    } catch (e) {
        toast.error("Erro ao remover item.");
    }
  };

  const { checkinsHoje, checkoutsHoje, concluidasHoje, taxaOcupacao, receitaRealizada, proximasChegadas, topQuartos } = useMemo(() => {
    const hojeStr = new Date().toISOString().split('T')[0];
    const amanhaStr = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];

    // Contadores agora refletem todo o período selecionado
    // Check-ins: Aquelas agendadas ou confirmadas que não entraram.
    const cis = reservas.filter(r => (r.statusQuarto === 'PENDENTE' || r.statusQuarto === 'AGENDADA' || r.statusQuarto === 'CONFIRMADA') && !r.checkinReal);
    // Check-outs: Confirmadas ou Ocupadas que ESTÃO no hotel (checkin ok, checkout null).
    const cos = reservas.filter(r => (r.statusQuarto === 'CONFIRMADA' || r.statusQuarto === 'OCUPADO') && r.checkinReal && !r.checkoutReal);
    const conc = reservas.filter(r => r.statusQuarto === 'CONCLUIDA' || (r.statusQuarto !== 'CANCELADA' && r.checkoutReal));
    
    const ocupadosCount = quartos.filter(q => {
        const st = statusDoQuarto(q.idQuarto);
        return st.label === "Ocupado";
    }).length;

    const taxa = totalQuartos > 0 ? Math.round((reservas.filter(r => r.statusQuarto === 'CONFIRMADA').length / totalQuartos) * 100) : 0;

    const receita = conc.reduce((acc, r) => {
        const dInicio = parseDate(r.dtInicio);
        const dFim = parseDate(r.dtFim);
        const diffDays = Math.max(1, Math.ceil((dFim - dInicio) / (1000 * 60 * 60 * 24)));
        const diarias = diffDays * (Number(r.valorDiaria) || 150);
        const consumo = Number(r.consumoExtra) || 0;
        return acc + diarias + consumo;
    }, 0);

    const prox = reservas.filter(r => toInputDate(r.dtInicio) === amanhaStr);
    
    const counts = {};
    reservas.forEach(r => {
        const key = r.quartoNome || `Quarto ${r.idQuarto}`;
        counts[key] = (counts[key] || 0) + 1;
    });
    const top = Object.entries(counts)
        .map(([nome, count]) => ({ nome, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return { checkinsHoje: cis, checkoutsHoje: cos, concluidasHoje: conc, taxaOcupacao: taxa, receitaRealizada: receita, proximasChegadas: prox, topQuartos: top };
  }, [reservas, quartos, totalQuartos]);

  const quartosExibidos = useMemo(() => {
    let list = (abaAtiva === "Inventário" || abaAtiva === "Limpeza") ? quartos : [];
    if (filtroStatus !== "Todos") {
      list = list.filter(q => statusDoQuarto(q.idQuarto).label === filtroStatus);
    }
    if (abaAtiva === "Limpeza") {
       list = list.filter(q => statusDoQuarto(q.idQuarto).label === "Limpeza");
    }
    return list;
  }, [quartos, abaAtiva, filtroStatus, reservas]);

  const totalComprovante = useMemo(() => {
    if (!reservaDetalhe) return 0;
    const dInicio = parseDate(reservaDetalhe.dtInicio);
    const dFim = parseDate(reservaDetalhe.dtFim);
    const diffDays = Math.max(1, Math.ceil((dFim - dInicio) / (1000 * 60 * 60 * 24)));
    const diárias = diffDays * (Number(reservaDetalhe.valorDiaria) || 150);
    const extras = itensConsumo.reduce((acc, it) => acc + (it.precoUnitario * it.quantidade), 0);
    return diárias + extras;
  }, [reservaDetalhe, itensConsumo]);


  return (
    <div className="space-y-8 print:p-0">
      <div className="print:hidden space-y-8">
        {/* Header e Abas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-white transition-all">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">Centro de Operações</h2>
                    <p className="text-sm text-slate-500 font-medium italic">Gestão em tempo real do Grand Hotel</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-slate-400 ml-2">calendar_today</span>
                    <input type="date" value={dtInicio} onChange={e => setDtInicio(e.target.value)} className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer p-1" />
                    <span className="text-[10px] font-black text-slate-300">ATÉ</span>
                    <input type="date" value={dtFim} onChange={e => setDtFim(e.target.value)} className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer p-1" />
                </div>
            </div>
            <div className="px-6 py-4 flex flex-wrap gap-3 bg-slate-50/50 dark:bg-slate-800/20">
                {[
                    { id: "Inventário", icon: "bed", count: totalQuartos, color: "text-primary", bg: "bg-primary/10" },
                    { id: "Check-in", icon: "login", count: checkinsHoje.length, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { id: "Check-out", icon: "logout", count: checkoutsHoje.length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
                    { id: "Limpeza", icon: "cleaning_services", count: quartos.filter(q => statusDoQuarto(q.idQuarto).label === "Limpeza").length, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { id: "Concluído", icon: "task_alt", count: concluidasHoje.length, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-500/10" }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setAbaAtiva(tab.id)} 
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-xs font-black transition-all border-2 ${
                            abaAtiva === tab.id 
                            ? `bg-white dark:bg-slate-800 border-primary shadow-lg shadow-primary/10 ${tab.color}` 
                            : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        }`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${abaAtiva === tab.id ? tab.color : "text-slate-300"}`}>{tab.icon}</span>
                        {tab.id.toUpperCase()}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] ${abaAtiva === tab.id ? `${tab.bg} ${tab.color}` : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: "Total de Quartos", val: totalQuartos, icon: "bed", color: "text-[#006972]", bg: "bg-[#006972]/10", badge: "Ativos" },
                { label: "Taxa de Ocupação", val: `${taxaOcupacao}%`, icon: "person_raised_hand", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", badge: "Hoje" },
                { label: "Check-ins Pendentes", val: checkinsHoje.length, icon: "login", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", badge: "Período" },
                { label: "Receita Realizada", val: receitaRealizada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: "payments", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", badge: "Filtro" }
            ].map((c, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`size-11 ${c.bg} rounded-xl flex items-center justify-center`}><span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${c.color} bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg h-fit border border-slate-100 dark:border-slate-700`}>{c.badge}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">{c.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{loading ? "—" : c.val}</p>
                </div>
            ))}
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                    <h3 className="text-base font-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">{abaAtiva === "Inventário" ? "bed" : abaAtiva === "Check-in" ? "login" : abaAtiva === "Check-out" ? "logout" : "cleaning_services"}</span>
                        {abaAtiva === "Inventário" ? "Gestão de Quartos" : `Operação de ${abaAtiva}`}
                    </h3>
                    {abaAtiva === "Inventário" && (
                        <div className="flex gap-1">
                            {["Todos", "Disponível", "Ocupado", "Limpeza", "Concluído"].map(f => (
                                <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filtroStatus === f ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}>{f}</button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto text-slate-900 dark:text-white">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50 dark:border-slate-800"><th className="px-6 py-4">Informação</th><th className="px-6 py-4">Status / Período</th><th className="px-6 py-4">Ação</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={3} className="px-6 py-6 animate-pulse"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td></tr>) : (
                                (abaAtiva === "Inventário" || abaAtiva === "Limpeza") ? (
                                    quartosExibidos.map(q => {
                                        const st = statusDoQuarto(q.idQuarto);
                                        return (
                                            <tr key={q.idQuarto} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                                <td className="px-6 py-4"><p className="font-black">{q.nome}</p><p className="text-[10px] text-slate-400 uppercase font-bold">#{q.idQuarto}</p></td>
                                                <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${st.bg} ${st.text}`}><span className={`size-1.5 rounded-full ${st.dot}`}></span>{st.label}</span></td>
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    {st.label === "Limpeza" ? (
                                                        <button onClick={() => toast.success("Quarto liberado!")} className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black uppercase rounded-xl">Pronto</button>
                                                    ) : (
                                                        <Link to={`/admin/quartos/${q.idQuarto}`} className="text-slate-400 hover:text-primary font-black uppercase text-[10px] transition-colors">Ficha</Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    (abaAtiva === "Check-in" ? checkinsHoje : abaAtiva === "Check-out" ? checkoutsHoje : abaAtiva === "Concluído" ? concluidasHoje : []).map(r => (
                                        <tr key={r.idReserva} className="hover:bg-slate-50/50 transition-all">
                                            <td className="px-6 py-4"><p className="font-black text-xs">{r.hospedeNome || r.usuario?.nome}</p><p className="text-[10px] text-slate-400">{r.quartoNome || `Quarto ${r.idQuarto}`}</p></td>
                                            <td className="px-6 py-4 text-[10px] font-black text-slate-400">{parseDate(r.dtInicio).toLocaleDateString()} - {parseDate(r.dtFim).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => {
                                                        if (abaAtiva === "Check-in") {
                                                            handleStatusUpdate(r, "OCUPADO");
                                                        } else {
                                                            handleActionReserva(r);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                        abaAtiva === "Check-in" 
                                                            ? "bg-primary text-slate-900" 
                                                            : "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                                                  }`}>
                                                     {abaAtiva === "Check-in" ? "Check-in" : abaAtiva === "Check-out" ? "Saída" : "Finalizado"}
                                                 </button>
                                             </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Sidebar Dash */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">event_upcoming</span>Próximas Chegadas</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px]">Amanhã</span>
                    </h3>
                    <div className="space-y-4">
                        {proximasChegadas.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma chegada prevista para amanhã.</p>
                        ) : (
                            proximasChegadas.slice(0, 4).map((r, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-primary flex items-center justify-center font-black text-[10px] text-slate-900">
                                            {getInitials(r.hospedeNome || r.usuario?.nome)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold leading-tight line-clamp-1">{r.hospedeNome || r.usuario?.nome}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{r.quartoNome || `Quarto ${r.idQuarto}`}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                                </div>
                            ))
                        )}
                        <Link to="/admin/reservas" className="flex items-center justify-center gap-2 w-full py-3 mt-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-primary hover:border-primary transition-all uppercase">Ver Agenda Completa</Link>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">star_rate</span>Mais Procurados</h3>
                    <div className="space-y-4">
                        {topQuartos.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3"><span className={`text-[10px] font-black ${idx === 0 ? "text-primary" : "text-slate-400"}`}>#0{idx+1}</span><p className="text-xs font-bold truncate max-w-[100px]">{t.nome}</p></div>
                                <div className="flex items-center gap-2"><span className="text-xs font-black">{t.count}</span><div className="w-16 h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(t.count / (topQuartos[0]?.count || 1)) * 100}%` }} /></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Modal / Comprovante (Ocupa tela toda no print) */}
      {reservaDetalhe && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 print:shadow-none print:rounded-none print:w-[210mm] print:mx-auto print:scale-[0.85] print:origin-top">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 print:hidden">
                    <h3 className="text-xl font-black">Finalização de Estadia</h3>
                    <button onClick={() => setReservaDetalhe(null)} className="size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-10 space-y-8 text-slate-900">
                    <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6">
                        <div><h2 className="text-3xl font-black text-primary tracking-tighter">GrandHotel</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante de Estadia • #{reservaDetalhe.idReserva}</p></div>
                        <div className="text-right"><p className="text-xs font-black text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-slate-400 uppercase italic">Emitido por: {user?.nome}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 divide-x divide-slate-50 font-['Plus_Jakarta_Sans']">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hóspede</label><p className="text-sm font-black">{reservaDetalhe.hospedeNome || reservaDetalhe.usuario?.nome}</p><p className="text-xs text-slate-500">{reservaDetalhe.usuario?.email || "Reserva Direta"}</p></div>
                        <div className="pl-8"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Acomodação</label><p className="text-sm font-black">{reservaDetalhe.quartoNome || `Quarto ${reservaDetalhe.idQuarto}`}</p><p className="text-xs text-slate-500">{parseDate(reservaDetalhe.dtInicio).toLocaleDateString()} — {parseDate(reservaDetalhe.dtFim).toLocaleDateString()}</p></div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-4 print:hidden">
                        <label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-sm">shopping_cart</span>Produtos e Extras</label>
                        <div className="flex gap-4">
                            <select 
                                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-700 outline-none" 
                                value={novoItem.idProduto}
                                onChange={e => {
                                    const p = produtosCatalogo.find(prod => String(prod.idProduto) === e.target.value);
                                    if (p) setNovoItem({ idProduto: p.idProduto, nome: p.nome, preco: p.preco });
                                }}
                            >
                                {produtosCatalogo.map(p => (
                                    <option key={p.idProduto} value={p.idProduto}>{p.nome} - {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                                ))}
                            </select>
                            <button onClick={handleAdicionarItem} className="px-6 py-2 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all">Lançar</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 pb-2 border-b border-slate-50"><span>Descrição</span><span>Subtotal</span></div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold"><span>Diárias ({Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24)))}x)</span><span>{(Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24))) * (reservaDetalhe.valorDiaria || 150)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                            {itensConsumo.map(it => (
                                <div key={it.idConsumo} className="flex justify-between items-center text-xs text-slate-500 font-medium group">
                                    <span>{it.nomeProduto} {it.quantidade > 1 ? `(x${it.quantidade})` : ""}</span>
                                    <div className="flex items-center gap-4">
                                        <span>{(it.precoUnitario * it.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        <button onClick={() => handleRemoverItem(it.idConsumo)} className="material-symbols-outlined text-sm text-red-300 hover:text-red-500 transition-colors print:hidden opacity-0 group-hover:opacity-100">delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                            <span className="text-primary font-black uppercase tracking-tighter text-lg">Total a Pagar</span>
                            <span className="text-3xl font-black text-slate-900">{totalComprovante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 print:hidden">
                        <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200">
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Forma de Pagamento</label>
                           <div className="flex gap-4">
                              {['PIX', 'Cartão', 'Dinheiro'].map(m => (
                                 <button key={m} onClick={() => setNovoItem({...novoItem, metodo: m})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all ${novoItem.metodo === m ? "border-primary bg-primary/10 text-primary" : "border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"}`}>{m}</button>
                              ))}
                           </div>
                        </div>
                        <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20"><span className="material-symbols-outlined">print</span>IMPRIMIR</button>
                        <button 
                            onClick={() => handleStatusUpdate(reservaDetalhe, "CONCLUIDA")}
                            className="flex-1 py-4 bg-primary text-slate-900 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                            FECHAR CONTA
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
