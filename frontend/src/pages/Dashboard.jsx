import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate } from "../utils/date-utils";

const STATUS_CONFIG = {
  "CONFIRMADA": { label: "Ocupado",    dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  "PENDENTE":   { label: "Pendente",   dot: "bg-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
  "CANCELADA":  { label: "Cancelado",  dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-500/10",     text: "text-red-600 dark:text-red-400" },
  "CONCLUIDA":  { label: "Concluída",  dot: "bg-slate-400",   bg: "bg-slate-50 dark:bg-slate-800",    text: "text-slate-500" },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const [quartos, setQuartos] = useState([]);
  const [totalQuartos, setTotalQuartos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [reservas, setReservas] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [loading, setLoading] = useState(true);

  // Filtros de Data Reais
  const [dtInicio, setDtInicio] = useState(toInputDate(new Date()));
  const [dtFim, setDtFim] = useState(toInputDate(new Date(Date.now() + 30 * 24 * 3600 * 1000)));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [qRes, rRes] = await Promise.all([
          quartoApi.list(page, 10, "idQuarto", "DESC"),
          reservaApi.quartosOcupados(dtInicio, dtFim),
        ]);

        setQuartos(qRes.data.content || []);
        setTotalQuartos(qRes.data.totalElements || 0);
        setTotalPages(qRes.data.totalPages || 1);
        setReservas(Array.isArray(rRes.data) ? rRes.data : []);
      } catch (err) {
        console.error("Erro no dashboard:", err);
        toast.error("Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, dtInicio, dtFim]);

  // Helper: converte data DD-MM-YYYY ou YYYY-MM-DD para Date de forma segura
  const parseDate = (d) => {
    if (!d) return new Date(NaN);
    try {
      if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
        const [day, month, year] = d.split("-");
        return new Date(`${year}-${month}-${day}T12:00:00`); // Meio-dia para evitar problemas de fuso
      }
      const date = new Date(d);
      if (isNaN(date.getTime())) return new Date(NaN);
      return date;
    } catch {
      return new Date(NaN);
    }
  };

  // Determina status visual de um quarto pelo cruzamento com reservas
  const statusDoQuarto = (idQuarto) => {
    // Primeiro verifica ocupação HOJE
    const hoje = new Date().toISOString().split('T')[0];
    const ocupadoHoje = reservas.find(r => {
      const inicio = parseDate(r.dtInicio).toISOString().split('T')[0];
      const fim = parseDate(r.dtFim).toISOString().split('T')[0];
      return r.idQuarto === idQuarto && inicio <= hoje && fim >= hoje;
    });

    if (ocupadoHoje) {
      const cfg = STATUS_CONFIG[ocupadoHoje.status] || STATUS_CONFIG["CONFIRMADA"];
      return { ...cfg, statusReal: "Ocupado" };
    }

    // Se não está ocupado hoje, verifica se há QUALQUER reserva no período selecionado
    const temReservaNoPeriodo = reservas.some(r => r.idQuarto === idQuarto);
    if (temReservaNoPeriodo) {
      return { 
        label: "Reservado", 
        dot: "bg-blue-400", 
        bg: "bg-blue-50 dark:bg-blue-500/5", 
        text: "text-blue-500",
        statusReal: "Ocupado" // Para o filtro
      };
    }

    return { 
      label: "Disponível", 
      dot: "bg-emerald-500", 
      bg: "bg-emerald-50 dark:bg-emerald-500/10", 
      text: "text-emerald-600 dark:text-emerald-400",
      statusReal: "Disponível" 
    };
  };

  // Filtra os quartos da tabela conforme o status
  const quartosExibidos = useMemo(() => {
    if (filtroStatus === "Todos") return quartos;
    return quartos.filter(q => statusDoQuarto(q.idQuarto).statusReal === filtroStatus);
  }, [quartos, filtroStatus, reservas]);

  // Calcula faturamento total do período
  const receitaNoPeriodo = useMemo(() => {
    return reservas.reduce((acc, r) => {
      const d1 = parseDate(r.dtInicio);
      const d2 = parseDate(r.dtFim);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return acc;
      
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const valor = Number(r.valorDiaria) || 0;
      
      return acc + (valor * diffDays);
    }, 0);
  }, [reservas]);

  const taxaOcupacao = totalQuartos > 0
    ? Math.min(100, Math.round((reservas.filter(r => {
        const hoje = new Date().toISOString().split('T')[0];
        const inicio = parseDate(r.dtInicio).toISOString().split('T')[0];
        const fim = parseDate(r.dtFim).toISOString().split('T')[0];
        return inicio <= hoje && fim >= hoje;
      }).length / totalQuartos) * 100))
    : 0;


  // Top Quartos (Calculado com base nas reservas do período)
  const topQuartos = useMemo(() => {
    const contagem = {};
    reservas.forEach(r => {
      const nome = r.quartoNome || `Quarto ${r.idQuarto}`;
      if (!contagem[nome]) contagem[nome] = { id: r.idQuarto, count: 0, nome };
      contagem[nome].count += 1;
    });
    
    return Object.values(contagem)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reservas]);

  const cards = [
    { label: "Total de Quartos", val: totalQuartos, icon: "bed", color: "text-[#006972]", bg: "bg-[#006972]/10", badge: "Ativos", badgeColor: "text-[#006972]" },
    { label: "Taxa de Ocupação", val: `${taxaOcupacao}%`, icon: "person_raised_hand", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", badge: `Hoje`, badgeColor: "text-blue-500" },
    { label: "Reservas no Período", val: reservas.length, icon: "event_note", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", badge: "Filtrado", badgeColor: "text-orange-500" },
    { label: "Receita no Período", val: receitaNoPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: "payments", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", badge: "Total", badgeColor: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header com Filtros de Data */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all text-slate-900 dark:text-white">
        <div>
           <h2 className="text-2xl font-black tracking-tight mb-1">Visão Geral</h2>
           <p className="text-sm text-slate-500 font-medium">Dados reais baseados no período selecionado</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
           <span className="material-symbols-outlined text-slate-400 ml-2">calendar_today</span>
           <input 
              type="date" 
              value={dtInicio}
              onChange={(e) => setDtInicio(e.target.value)}
              className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer p-1"
           />
           <span className="text-[10px] font-black text-slate-300">ATÉ</span>
           <input 
              type="date" 
              value={dtFim}
              onChange={(e) => setDtFim(e.target.value)}
              className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer p-1"
           />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className={`size-11 ${c.bg} rounded-xl flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${c.badgeColor} bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md`}>
                {c.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">{c.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading ? "—" : c.val}
            </p>
          </div>
        ))}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Inventário de Quartos */}
        <div className="xl:col-span-2 space-y-6 text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">bed</span>
                 Inventário de Quartos
              </h3>
              <div className="flex gap-1">
                {["Todos", "Disponível", "Ocupado"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroStatus(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filtroStatus === f ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800">
                    <th className="px-6 py-3">Quarto</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Status Atual</th>
                    <th className="px-6 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : (
                    quartosExibidos.map(q => {
                      const st = statusDoQuarto(q.idQuarto);
                      return (
                        <tr key={q.idQuarto} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                             <p className="font-black leading-tight">{q.nome}</p>
                             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">ID #{q.idQuarto}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">{q.tipo || "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}>
                              <span className={`size-1.5 rounded-full ${st.dot}`}></span>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/admin/quartos/${q.idQuarto}`} className="text-[#006972] hover:underline text-xs font-bold uppercase tracking-widest">Editar</Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Exibindo {quartosExibidos.length} de {totalQuartos} quartos
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="size-8 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="size-8 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Top Quartos */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary text-xl">star_rate</span>
                   Mais Procurados no Período
                </h3>
                <div className="space-y-4">
                   {topQuartos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Dados insuficientes no período.</p>
                   ) : (
                      topQuartos.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className={`text-xs font-black ${idx === 0 ? "text-primary" : "text-slate-400"}`}>#0{idx+1}</span>
                              <div>
                                 <p className="text-sm font-bold">{t.nome}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">Frequência de reservas</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900 dark:text-white">{t.count}</span>
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${(t.count / Math.max(1, topQuartos[0].count)) * 100}%` }}
                                 />
                              </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>

             {/* Outra funcionalidade real: Status Rápido */}
             <div className="bg-[#131b30] rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
                <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-white/5 text-[150px] rotate-12">monitoring</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-2">Performance Atual</h3>
                <p className="text-3xl font-black mb-6">Eficiência Alta</p>
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-white/60">Taxa de Ocupação Hoje</span>
                      <span>{taxaOcupacao}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 font-black transition-all" style={{ width: `${taxaOcupacao}%` }} />
                   </div>
                   <Link to="/admin/reservas" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-110 transition-all mt-4">
                      Gerenciar Calendário
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                   </Link>
                </div>
             </div>
          </div>
        </div>

        {/* Reservas no Período */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full h-[600px] xl:h-auto text-slate-900 dark:text-white">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">history</span>
               Período Selecionado
            </h3>
            <Link to="/admin/reservas" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver Tudo</Link>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800 flex-1 overflow-y-auto">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-3 animate-pulse">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : reservas.length === 0 ? (
              <div className="px-6 py-12 text-center h-full flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-6xl mb-4 font-thin">calendar_today</span>
                <p className="text-slate-400 text-sm font-medium">Sem reservas registradas no período.</p>
              </div>
            ) : (
              reservas.slice(0, 15).map((r, i) => {
                const formatDateStr = (d) => {
                  if (!d) return "";
                  try {
                    const parts = typeof d === "string" && d.includes("-")
                      ? (d.split("T")[0].split("-").length === 3 && d.split("T")[0].split("-")[0].length === 4
                          ? d.split("T")[0]
                          : d.split("-").reverse().join("-"))
                      : d;
                    return new Date(parts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                  } catch { return ""; }
                };

                const nomeHospede = r.hospedeNome || r.nomeHospede || "Hóspede";

                return (
                  <div key={r.idReserva || i} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">
                      {getInitials(nomeHospede)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="font-black text-sm truncate">{nomeHospede}</p>
                        <span className="text-[10px] font-black text-slate-300">#{r.idReserva}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight truncate">
                         {r.quartoNome || `Quarto ${r.idQuarto}`} • {formatDateStr(r.dtInicio)} – {formatDateStr(r.dtFim)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
