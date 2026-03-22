import { useState, useEffect, useMemo } from "react";
import { reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate } from "../utils/date-utils";

export default function Hospedagem() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      const res = await reservaApi.quartosOcupados(hoje, hoje);
      setReservas(res.data || []);
    } catch (e) {
      toast.error("Erro ao carregar hospedagens ativas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ocupadasAtivas = useMemo(() => {
    return reservas.filter(r => r.status !== 'CANCELADA' && r.status !== 'CONCLUIDA');
  }, [reservas]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">hotel_class</span>
          Check-ins Ativos
        </h2>
        <p className="text-slate-500 font-medium">Controle de hóspedes atualmente em estadia no hotel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-3xl" />)
        ) : (
          ocupadasAtivas.map(r => (
            <div key={r.idReserva} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-lg">{r.hospedeNome || r.usuario?.nome}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{r.quartoNome || `Quarto ${r.idQuarto}`}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg italic">Ativa</span>
              </div>
              <div className="space-y-3 mb-6 font-medium text-sm text-slate-600 dark:text-slate-400">
                 <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">calendar_today</span> {new Date(r.dtInicio).toLocaleDateString()} — {new Date(r.dtFim).toLocaleDateString()}</div>
                 <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> {r.hospedeEmail || "N/A"}</div>
              </div>
              <div className="flex gap-2">
                 <button className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-all">Lançar Consumo</button>
                 <button className="flex-1 py-2.5 bg-primary text-slate-900 text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all">Check-out</button>
              </div>
            </div>
          ))
        )}
      </div>
      {ocupadasAtivas.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 tracking-tighter">bedtime</span>
            <p className="text-slate-400 font-bold">Nenhuma hospedagem ativa no momento.</p>
        </div>
      )}
    </div>
  );
}
