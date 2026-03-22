import { useState, useEffect, useMemo } from "react";
import { reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate, formatDate } from "../utils/date-utils";

export default function CheckIn() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      // No GrandHotel, check-in hoje são reservas que começam hoje
      const res = await reservaApi.quartosOcupados(hoje, hoje);
      // Filtramos apenas as que NÃO estão concluídas/canceladas e que começam HOJE
      const pendentes = (res.data || []).filter(r => {
        const dIniStr = toInputDate(r.dtInicio);
        return dIniStr === hoje && r.statusQuarto !== 'CANCELADA' && r.statusQuarto !== 'OCUPADO' && r.statusQuarto !== 'CONCLUIDA';
      });
      setReservas(pendentes);
    } catch (e) {
      toast.error("Erro ao carregar chegadas previstas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = useMemo(() => {
    return reservas.filter(r => 
      (r.hospedeNome || r.usuario?.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
      String(r.idReserva).includes(busca)
    );
  }, [reservas, busca]);

  const handleCheckIn = async (reserva) => {
    try {
      await reservaApi.update(reserva.idReserva, {
        ...reserva,
        idUsuario: reserva.idUsuario || reserva.usuario?.idUsuario,
        idQuarto: reserva.idQuarto || reserva.quarto?.idQuarto,
        statusQuarto: "OCUPADO",
        checkinReal: new Date().toISOString()
      });
      toast.success("Check-in realizado com sucesso! Quarto ativado como OCUPADO.");
      carregar();
    } catch (e) {
      toast.error("Erro ao processar check-in operacional.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">login</span>
            Chegadas de Hoje
          </h2>
          <p className="text-slate-500 font-medium">Hóspedes com reserva iniciando nesta data.</p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Nome ou ID da reserva..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-56 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />)
        ) : filtradas.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">event_busy</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum check-in pendente para hoje.</p>
          </div>
        ) : (
          filtradas.map(r => (
            <div key={r.idReserva} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
              <span className="absolute -top-4 -right-4 text-[100px] material-symbols-outlined text-slate-50 dark:text-slate-800/10 group-hover:rotate-12 transition-transform duration-700">login</span>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{r.hospedeNome || r.usuario?.nome}</h3>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">Reserva #{r.idReserva}</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400">Pendente</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">bed</span>
                    </div>
                    {r.quartoNome || `Quarto ${r.idQuarto}`} 
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-400">{r.quarto?.tipo || "UH"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                    </div>
                    Expira em {formatDate(r.dtFim)}
                  </div>
                </div>

                <button 
                  onClick={() => handleCheckIn(r)}
                  className="w-full py-4 bg-primary text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Realizar Check-in
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
