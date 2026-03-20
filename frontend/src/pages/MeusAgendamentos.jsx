import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { reservaApi } from "../services/api";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MeusAgendamentos() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      if (!user?.nome) return;
      setLoading(true);
      try {
        const res = await reservaApi.getByUsuario(user.nome);
        setReservas(res.data.Reservas || []);
      } catch (e) {
        console.error("Erro ao carregar agendamentos", e);
        toast.error("Não foi possível carregar seus agendamentos.");
      } finally {
        setLoading(false);
      }
    };
    if (user) carregar();
  }, [user]);

  if (authLoading) return <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center font-black text-slate-400 uppercase tracking-widest">Sincronizando Dados...</div>;
  if (!isAuthenticated) return <Navigate to="/login-cliente" replace />;

  return (
    <div className="min-h-screen bg-[#faf8ff] font-['Plus_Jakarta_Sans'] pb-20">
      {/* Mini Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center px-8 h-20">
        <div className="text-xl font-extrabold tracking-tighter text-[#006972]">GrandHotel</div>
        <div className="flex items-center gap-6">
           <Link to="/" className="text-xs font-black uppercase text-slate-400 hover:text-[#006972] transition-colors">Ver Quartos</Link>
           <div className="size-10 rounded-full bg-[#006972]/5 text-[#006972] flex items-center justify-center font-black border border-[#006972]/10 capitalize">
              {user?.nome?.charAt(0)}
           </div>
        </div>
      </nav>

      <main className="pt-32 px-8 max-w-5xl mx-auto">
        <div className="mb-12">
            <h1 className="text-4xl font-black text-[#131b30] tracking-tighter mb-2">Meus Agendamentos</h1>
            <p className="text-slate-500 font-medium text-lg">Acompanhe suas estadias confirmadas e o status de suas reservas.</p>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm" />
                ))}
            </div>
        ) : reservas.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-outlined text-slate-300 text-4xl">calendar_add_on</span>
                </div>
                <h3 className="text-2xl font-black text-[#131b30] mb-4">Ainda nada por aqui.</h3>
                <p className="text-slate-400 font-medium mb-12 max-w-sm mx-auto">Suas reservas futuras aparecerão aqui assim que você selecionar sua primeira acomodação.</p>
                <Link to="/" className="bg-[#006972] text-white px-10 py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-[#006972]/30 hover:scale-105 active:scale-95 transition-all inline-block">
                    Começar Minha Jornada
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {reservas.map(res => (
                    <div key={res.idReserva} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group flex flex-col md:flex-row md:items-center gap-8">
                        <div className="size-24 rounded-3xl bg-gradient-to-br from-[#006972] to-[#004f56] flex flex-col items-center justify-center text-white shrink-0">
                           <span className="text-[10px] font-black uppercase opacity-60">ID #</span>
                           <span className="text-2xl font-black tracking-tighter">{res.idReserva}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006972] bg-[#006972]/5 px-3 py-1 rounded-full">Reserva Confirmada</span>
                            </div>
                            <h3 className="text-2xl font-black text-[#131b30] mb-4 group-hover:text-[#006972] transition-colors">
                                Quarto {res.idQuarto}
                            </h3>
                            <div className="flex flex-wrap gap-10">
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</span>
                                  <span className="text-sm font-black text-[#131b30]">{new Date(res.dtInicio).toLocaleDateString('pt-BR')}</span>
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</span>
                                  <span className="text-sm font-black text-[#131b30]">{new Date(res.dtFim).toLocaleDateString('pt-BR')}</span>
                               </div>
                               <div className="flex flex-col ml-auto text-right">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Pagamento</span>
                                  <span className="text-sm font-black text-green-500">Pendente no Check-in</span>
                               </div>
                            </div>
                        </div>
                        <div className="md:px-8 border-l border-slate-100 flex items-center justify-center">
                            <button onClick={() => toast.info("Funcionalidade em desenvolvimento.")} className="size-16 rounded-3xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center" title="Detalhes">
                               <span className="material-symbols-outlined">expand_circle_right</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                <div className="mt-16 p-10 bg-[#131b30] rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black mb-4">Precisa de ajuda com sua estadia?</h4>
                        <p className="text-slate-400 font-medium mb-8 max-w-sm">Nossa equipe de concierge está disponível 24h para tornar sua experiência inesquecível.</p>
                        <button className="bg-[#8edce6] text-[#004f56] px-10 py-5 rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#8edce6]/10">Falar com Concierge</button>
                    </div>
                    <div className="absolute right-[-10%] bottom-[-20%] opacity-10 pointer-events-none">
                        <span className="material-symbols-outlined text-[20rem]">support_agent</span>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
