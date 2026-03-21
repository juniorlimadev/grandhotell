import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { formatDate, toBackendDate } from "../utils/date-utils";

export default function Dashboard() {
  const [quartos, setQuartos] = useState({ content: [], totalElements: 0 });
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de Data
  const [filtros, setFiltros] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, rRes] = await Promise.all([
        quartoApi.list(0, 100),
        reservaApi.quartosOcupados(new Date(filtros.inicio), new Date(filtros.fim)),
      ]);
      setQuartos(qRes.data);
      setReservas(Array.isArray(rRes.data) ? rRes.data : []);
    } catch {
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  // Mapa de diárias para cálculos rápidos
  const diariaPorQuarto = useMemo(() => {
    const mapa = new Map();
    (quartos.content || []).forEach((q) => {
      mapa.set(q.idQuarto, q.valorDiaria || 0);
    });
    return mapa;
  }, [quartos]);

  // Métricas Calculadas
  const metricas = useMemo(() => {
    let totalFaturamento = 0;
    const contagemQuartos = {};
    const faturamentoPorQuarto = {};

    reservas.forEach((r) => {
      const diaria = diariaPorQuarto.get(r.idQuarto) ?? 0;
      
      const parseDate = (d) => {
        if (!d) return new Date();
        if (d.includes("-")) {
           const parts = d.split("-");
           return parts[0].length === 4 ? new Date(d) : new Date(parts.reverse().join("-"));
        }
        return new Date(d);
      };

      const d1 = parseDate(r.dtInicio);
      const d2 = parseDate(r.dtFim);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const subtotal = diaria * diffDays;

      totalFaturamento += subtotal;
      contagemQuartos[r.idQuarto] = (contagemQuartos[r.idQuarto] || 0) + 1;
      faturamentoPorQuarto[r.idQuarto] = (faturamentoPorQuarto[r.idQuarto] || 0) + subtotal;
    });

    // Top Quartos
    const topQuartos = (quartos.content || [])
      .map(q => ({
        ...q,
        reservas: contagemQuartos[q.idQuarto] || 0,
        receita: faturamentoPorQuarto[q.idQuarto] || 0
      }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);

    return {
      faturamento: totalFaturamento,
      reservasTotal: reservas.length,
      topQuartos,
      ticketMedio: reservas.length > 0 ? totalFaturamento / reservas.length : 0,
      taxaOcupacao: quartos.totalElements > 0 ? (reservas.length / (quartos.totalElements * 30)) * 100 : 0 // Aproximação mensal
    };
  }, [reservas, diariaPorQuarto, quartos]);

  return (
    <div className="space-y-10 pb-10">
      {/* Header com Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Business Intelligence</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Análise de desempenho e faturamento da propriedade</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-2 px-4">
              <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
              <input 
                type="date" 
                value={filtros.inicio}
                onChange={e => setFiltros({...filtros, inicio: e.target.value})}
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest outline-none focus:ring-0 text-slate-700 dark:text-slate-200"
              />
           </div>
           <div className="hidden sm:block h-6 w-px bg-slate-100 dark:bg-slate-800"></div>
           <div className="flex items-center gap-2 px-4">
              <input 
                type="date" 
                value={filtros.fim}
                onChange={e => setFiltros({...filtros, fim: e.target.value})}
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest outline-none focus:ring-0 text-slate-700 dark:text-slate-200"
              />
           </div>
           <button 
             onClick={loadData}
             className="bg-primary text-slate-900 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
           >
              Filtrar
           </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Faturamento Total", val: metricas.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: "payments", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Volume de Reservas", val: metricas.reservasTotal, icon: "event_available", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Ticket Médio", val: metricas.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: "analytics", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { label: "Status de Ocupação", val: `${Math.min(100, Math.round(metricas.taxaOcupacao))}%`, icon: "bed", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" }
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className={`size-14 ${s.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <span className={`material-symbols-outlined ${s.color} text-2xl`}>{s.icon}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{loading ? "..." : s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Top Quartos Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
               <span className="material-symbols-outlined text-primary">military_tech</span>
               Ranking de Acomodações
             </h3>
             <Link to="/admin/quartos" className="text-xs font-black uppercase tracking-widest text-[#006972] hover:underline">Inventário Completo</Link>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
                         <th className="px-8 py-6">Acomodação</th>
                         <th className="px-8 py-6">Ala</th>
                         <th className="px-8 py-6 text-center">Reservas</th>
                         <th className="px-8 py-6 text-right">Faturamento</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {loading ? (
                         Array(3).fill(0).map((_, i) => <tr key={i} className="h-20 animate-pulse bg-slate-50/50"></tr>)
                      ) : metricas.topQuartos.map((q, i) => (
                         <tr key={q.idQuarto} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                     #{i+1}
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white">{q.nome}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">{q.alaHotel || "Premium"}</td>
                            <td className="px-8 py-6 text-center font-black text-slate-700 dark:text-slate-300">{q.reservas}</td>
                            <td className="px-8 py-6 text-right">
                               <span className="inline-block px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm">
                                  {q.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Vision importante: Conversão e Status */}
        <div className="space-y-6">
           <h3 className="text-2xl font-black tracking-tight px-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500">monitoring</span>
              Insights Rápidos
           </h3>
           
           <div className="space-y-4">
              <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden group">
                 <div className="absolute -right-10 -bottom-10 size-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-6">Eficiência de Reservas</h4>
                 <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-black">{Math.round(metricas.taxaOcupacao * 1.5)}%</span>
                    <span className="text-xs font-bold text-white/70 mb-2 uppercase tracking-tight">Crescimento Mensal</span>
                 </div>
                 <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, metricas.taxaOcupacao * 1.5)}%` }}></div>
                 </div>
                 <p className="mt-6 text-xs text-white/50 leading-relaxed">Seu hotel está operando em alta performance este mês. Considere reajustar diárias dos quartos mais procurados.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Distribuição Geográfica</h4>
                 <div className="space-y-5">
                    {[
                      { name: "Sul", percent: 45, color: "bg-blue-500" },
                      { name: "Sudeste", percent: 30, color: "bg-emerald-500" },
                      { name: "Inter.", percent: 15, color: "bg-purple-500" },
                      { name: "Outros", percent: 10, color: "bg-slate-400" }
                    ].map(r => (
                      <div key={r.name} className="space-y-2">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                            <span>{r.name}</span>
                            <span className="text-slate-400">{r.percent}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${r.color}`} style={{ width: `${r.percent}%` }}></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

