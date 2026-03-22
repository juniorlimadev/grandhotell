import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { reservaApi } from "../services/api";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MeusAgendamentos() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);

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

  const formatData = (d) => {
    if (!d) return "N/A";
    if (typeof d === 'string' && d.includes('-') && d.split('-')[0].length === 2) {
        return d;
    }
    try {
        return new Date(d).toLocaleDateString('pt-BR');
    } catch (e) {
        return d;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center font-black text-slate-400 uppercase tracking-widest">Sincronizando Dados...</div>;
  if (!isAuthenticated) return <Navigate to="/login-cliente" replace />;

  return (
    <div className="min-h-screen bg-[#faf8ff] font-['Plus_Jakarta_Sans'] pb-20">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex justify-between items-center px-4 md:px-8 h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-10 bg-[#006972] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#006972]/20 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-2xl">apartment</span>
          </div>
          <div className="text-xl font-extrabold tracking-tighter text-[#006972] hidden sm:block">
             GrandHotel
          </div>
        </Link>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
          <Link to="/" className="text-slate-500 hover:text-[#006972] transition-colors text-sm font-bold tracking-tight">Acomodações</Link>
          <Link to="/meus-agendamentos" className="text-[#006972] font-black border-b-2 border-[#006972] pb-1 text-sm tracking-tight">Meus Agendamentos</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#006972] uppercase tracking-widest bg-[#006972]/5 px-4 py-2 rounded-full">Olá, {user?.nome?.split(' ')[0]}</span>
          <button 
            onClick={() => logout()}
            className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Sair
          </button>
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
                                  <span className="text-sm font-black text-[#131b30]">{formatData(res.dtInicio)}</span>
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</span>
                                  <span className="text-sm font-black text-[#131b30]">{formatData(res.dtFim)}</span>
                               </div>
                               <div className="flex flex-col ml-auto text-right">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Pagamento</span>
                                  <span className="text-sm font-black text-green-500">Pendente no Check-in</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:px-8 border-l border-slate-100 flex items-center justify-center">
                            <button 
                                onClick={() => setReservaSelecionada(res)} 
                                className="size-16 rounded-3xl bg-slate-50 text-slate-400 hover:bg-[#006972] hover:text-white transition-all flex items-center justify-center group/btn" 
                                title="Detalhes"
                            >
                               <span className="material-symbols-outlined group-hover/btn:scale-110 transition-transform">expand_circle_right</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Modal de Detalhes da Reserva */}
        {reservaSelecionada && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-[#131b30]/60 backdrop-blur-sm animate-in fade-in duration-300" 
                    onClick={() => setReservaSelecionada(null)}
                ></div>
                <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="h-40 bg-gradient-to-br from-[#006972] to-[#004f56] p-10 flex items-end">
                        <div className="flex-1">
                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Reserva Confirmada</span>
                            <h2 className="text-white text-3xl font-black tracking-tighter">Detalhes do Agendamento</h2>
                        </div>
                        <button 
                            onClick={() => setReservaSelecionada(null)}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div className="p-10 space-y-8">
                        <div className="flex justify-between border-b border-slate-50 pb-6">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Código da Reserva</span>
                                <span className="text-xl font-black text-[#131b30]">#{reservaSelecionada.idReserva}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quarto Selecionado</span>
                                <span className="text-xl font-black text-[#006972]">Quarto {reservaSelecionada.idQuarto}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Entrada</span>
                                <span className="text-lg font-black text-[#131b30]">{formatData(reservaSelecionada.dtInicio)}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Saída</span>
                                <span className="text-lg font-black text-[#131b30]">{formatData(reservaSelecionada.dtFim)}</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-4 text-slate-500 mb-2">
                                <span className="material-symbols-outlined text-[#006972]">verified_user</span>
                                <span className="text-sm font-bold">Reserva vinculada a {user?.nome}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500">
                                <span className="material-symbols-outlined text-[#006972]">payments</span>
                                <span className="text-sm font-bold">Pagamento a ser realizado no balcão</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setReservaSelecionada(null)}
                            className="w-full bg-[#131b30] text-white py-5 rounded-[2rem] font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#131b30]/20"
                        >
                            Fechar Visualização
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
