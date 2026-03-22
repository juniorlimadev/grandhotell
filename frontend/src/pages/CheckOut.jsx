import { useState, useEffect, useMemo } from "react";
import { reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate } from "../utils/date-utils";

export default function CheckOut() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      // No GrandHotel, check-out são hospedagens ativas (CONFIRMADA/OCUPADO)
      const res = await reservaApi.quartosOcupados(hoje, hoje);
      // Filtramos apenas as que estão ATIVAS (CONFIRMADA no sistema ou OCUPADO)
      const ativas = (res.data || []).filter(r => 
        (r.status === 'CONFIRMADA' || r.status === 'OCUPADO') && r.status !== 'CANCELADA' && r.status !== 'CONCLUIDA'
      );
      setReservas(ativas);
    } catch (e) {
      toast.error("Erro ao carregar estadias ativas.");
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

  const handleCheckOut = async (reserva) => {
    try {
      await reservaApi.update(reserva.idReserva, {
        ...reserva,
        idUsuario: reserva.idUsuario || reserva.usuario?.idUsuario,
        idQuarto: reserva.idQuarto || reserva.quarto?.idQuarto,
        statusQuarto: "CONCLUIDA",
        checkoutReal: new Date().toISOString()
      });
      toast.success("Check-out finalizado! Estadia encerrada no sistema.");
      carregar();
    } catch (e) {
      toast.error("Erro ao processar fechamento de conta.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-orange-500">
            <span className="material-symbols-outlined uppercase">logout</span>
            Check-out e Ativas
          </h2>
          <p className="text-slate-500 font-medium">Hóspedes atualmente em estadia que desejam encerrar conta.</p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Nome ou ID da estadia..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-56 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />)
        ) : filtradas.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">hotel_class</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma hospedagem ativa encontrada.</p>
          </div>
        ) : (
          filtradas.map(r => (
            <div key={r.idReserva} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
              <span className="absolute -top-4 -right-4 text-[100px] material-symbols-outlined text-slate-50 dark:text-slate-800/10 group-hover:rotate-12 transition-transform duration-700">logout</span>
              
              {/* Badge Financeira se houver consumo */}
              {r.consumoExtra > 0 && (
                 <div className="absolute top-8 right-8 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-red-100 z-20">
                    <span className="material-symbols-outlined text-xs">payments</span>
                    Consumo: R$ {r.consumoExtra.toFixed(2)}
                 </div>
              )}

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{r.hospedeNome || r.usuario?.nome}</h3>
                    <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest mt-1">Hospedagem #{r.idReserva}</p>
                  </div>
                  {!r.consumoExtra && <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-[10px] font-black uppercase text-emerald-500">Ocupado</div>}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined text-sm">bed</span>
                    </div>
                    {r.quartoNome || `Quarto ${r.idQuarto}`} 
                    {r.placaVeiculo && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-400 uppercase">🚗 {r.placaVeiculo}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined text-sm">event_repeat</span>
                    </div>
                    Check-in real: {new Date(r.checkinReal || r.dtInicio).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-3">
                   <button className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">+ Consumo</button>
                   <button 
                     onClick={() => handleCheckOut(r)}
                     className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     Encerrar Estadia
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
