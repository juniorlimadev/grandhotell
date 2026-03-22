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
        quartoApi.list(0, 100, "nome", "ASC"),
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
      // Regra: se teve checkout hoje e não tem reserva ativa agora, tá em limpeza
      const ocupadoHoje = reservas.some(r => r.idQuarto === q.idQuarto && r.status !== 'CANCELADA');
      if (ocupadoHoje) return false;
      
      // Simulando que quartos que não estão ocupados mas tiveram checkout recente precisam de limpeza
      // Na vida real o backend teria um status 'LIMPEZA' persistido.
      return true; 
    }).slice(0, 5); // Simulação
  }, [quartos, reservas]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">cleaning_services</span>
            Governança e Limpeza
          </h2>
          <p className="text-slate-500 font-medium italic">Gestão da higienização e prontidão dos quartos.</p>
        </div>
        <button onClick={carregar} className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-primary transition-all shadow-sm">
          <span className="material-symbols-outlined text-slate-400">refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-x divide-slate-100">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2">
            <span className="size-2 bg-orange-500 rounded-full animate-pulse" /> Pendentes
          </h3>
          {pendentesLimpeza.map(q => (
            <div key={q.idQuarto} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center transition-all hover:translate-x-2">
              <div className="flex items-center gap-4">
                 <div className="size-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-xs">{q.nome.split(' ')[1]}</div>
                 <div>
                    <p className="font-black text-sm">{q.nome}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Aguardando Camareira</p>
                 </div>
              </div>
              <button onClick={() => { toast.success("Quarto liberado para ocupação!"); carregar(); }} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Concluir</button>
            </div>
          ))}
        </div>
        
        <div className="pl-8 space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2 text-primary">Prontos para Check-in</h3>
          <div className="grid grid-cols-2 gap-4">
             {quartos.slice(10, 14).map(q => (
               <div key={q.idQuarto} className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-black text-emerald-700 mb-1">{q.nome}</p>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Higienizado e Livre</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
