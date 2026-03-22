import { useState, useEffect, useMemo } from "react";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate } from "../utils/date-utils";

export default function Limpeza() {
  const [quartos, setQuartos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      const [qRes, rRes] = await Promise.all([
        quartoApi.list(0, 500, "nome", "ASC"),
        reservaApi.quartosOcupados(hoje, hoje)
      ]);
      setQuartos(qRes.data.content || []);
      setReservas(rRes.data || []);
    } catch (e) {
      toast.error("Erro ao carregar dados de governança.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const pendentesLimpeza = useMemo(() => {
    const hojeStr = new Date().toISOString().split('T')[0];
    return quartos.filter(q => {
        // Regra 1: Status manual no banco é LIMPEZA
        if (q.statusOperacional === "LIMPEZA") return true;

        // Regra 2: Se teve checkout hoje (data fim === hoje) e não está ocupado por outro hoje
        const teveCheckoutHoje = reservas.some(r => {
            const fim = new Date(r.dtFim).toISOString().split('T')[0];
            return r.idQuarto === q.idQuarto && fim === hojeStr && r.status === 'CONCLUIDA';
        });

        const ocupadoAgora = reservas.some(r => {
            const ini = new Date(r.dtInicio).toISOString().split('T')[0];
            const fim = new Date(r.dtFim).toISOString().split('T')[0];
            return r.idQuarto === q.idQuarto && ini <= hojeStr && fim >= hojeStr && (r.status === 'CONFIRMADA' || r.status === 'OCUPADO');
        });

        return teveCheckoutHoje && !ocupadoAgora;
    });
  }, [quartos, reservas]);

  const handleConcluir = async (quarto) => {
    try {
      // Atualiza status do quarto para DISPONIVEL
      await quartoApi.update(quarto.idQuarto, {
        ...quarto,
        statusOperacional: "DISPONIVEL"
      });
      toast.success(`${quarto.nome} liberado para reserva!`);
      carregar();
    } catch (e) {
      toast.error("Erro ao atualizar status do quarto.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center overflow-hidden relative group">
        <span className="absolute -right-10 -top-10 text-[180px] material-symbols-outlined text-slate-50 dark:text-slate-800/20 group-hover:rotate-12 transition-transform duration-1000">cleaning_services</span>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">cleaning_services</span>
            Painel da Camareira
          </h2>
          <p className="text-slate-500 font-medium italic">Gestão da higienização e liberação imediata de unidades.</p>
        </div>
        <button onClick={carregar} className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-primary shadow-sm active:scale-95 transition-all relative z-10">
          <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-900">refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2">
            <span className="size-2 bg-orange-500 rounded-full animate-pulse" /> Pendentes de Sugestão/Check-out
          </h3>
          {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />)
          ) : pendentesLimpeza.length === 0 ? (
            <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 opacity-40">
                <span className="material-symbols-outlined text-5xl mb-4">check_circle</span>
                <p className="text-xs font-black uppercase">Todos os quartos limpos no momento</p>
            </div>
          ) : (
            pendentesLimpeza.map(q => (
                 <div key={q.idQuarto} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center transition-all hover:scale-[1.02] hover:shadow-xl group">
                  <div className="flex items-center gap-4">
                     <div className="size-14 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xs ring-1 ring-orange-100">
                        {q.nome ? q.nome.split(' ').pop() : q.idQuarto}
                     </div>
                     <div>
                        <p className="font-black text-slate-900 dark:text-white">{q.nome || `Quarto ${q.idQuarto}`}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aguardando Camareira</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleConcluir(q)}
                    className="px-6 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    Pronto
                  </button>
                </div>
            ))
          )}
        </div>
        
        <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-900 h-full">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest flex items-center gap-2 text-primary">Relatório de Ocupação Hoje</h3>
          <div className="grid grid-cols-2 gap-4">
             {quartos.filter(q => q.statusOperacional === 'DISPONIVEL' && !pendentesLimpeza.includes(q)).slice(0, 8).map(q => (
               <div key={q.idQuarto} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1">{q.nome}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Pronto e Livre</span>
                  </div>
               </div>
             ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
             <span>Progresso do Dia</span>
             <span className="text-primary">{Math.round((quartos.length - pendentesLimpeza.length) / (quartos.length || 1) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
             <div className="h-full bg-primary" style={{ width: `${(quartos.length - pendentesLimpeza.length) / (quartos.length || 1) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
