import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [quartos, setQuartos] = useState([]);
  const [reservasAtivas, setReservasAtivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalBooking, setModalBooking] = useState(false);
  const [quartoSelecionado, setQuartoSelecionado] = useState(null);
  const [formReserva, setFormReserva] = useState({
    hospedeNome: "",
    hospedeEmail: "",
    dtInicio: "",
    dtFim: "",
    observacoes: ""
  });
  const [datasOcupadas, setDatasOcupadas] = useState([]);
  const [reservando, setReservando] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [dtBuscaInicio, setDtBuscaInicio] = useState("");
  const [dtBuscaFim, setDtBuscaFim] = useState("");

  const handleBuscar = async () => {
    if (!dtBuscaInicio || !dtBuscaFim) return toast.warning("Selecione entrada e saída");
    setLoading(true);
    try {
        const rRes = await reservaApi.quartosOcupados(dtBuscaInicio, dtBuscaFim);
        setReservasAtivas(rRes.data || []);
        toast.info("Resultados atualizados para estas datas!");
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    const carregar = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const [qRes, rRes] = await Promise.all([
            quartoApi.list(0, 100, "idQuarto", "DESC"),
            reservaApi.quartosOcupados(hoje, hoje)
        ]);
        setQuartos(qRes.data.content || []);
        setReservasAtivas(rRes.data || []);
      } catch (e) {
        console.error("Erro ao carregar dados para a Home", e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const quartosDisponiveis = useMemo(() => {
    return quartos.filter(q => {
        // Remove quartos que estão ocupados HOJE
        const ocupadoHoje = reservasAtivas.some(r => r.idQuarto === q.idQuarto && r.status !== 'CANCELADA');
        if (ocupadoHoje) return false;

        // Filtro de categoria
        if (filtro === "Todos") return true;
        if (filtro === "Suítes") return q.tipo?.toLowerCase().includes("suíte");
        if (filtro === "Premium") return q.tipo?.toLowerCase().includes("premium") || q.tipo?.toLowerCase().includes("luxo");
        return true;
    });
  }, [quartos, reservasAtivas, filtro]);

  const abrirReserva = async (quarto) => {
    if (!isAuthenticated) {
        toast.warning("Para realizar uma reserva, você precisa estar logado.");
        navigate("/login-cliente");
        return;
    }
    setQuartoSelecionado(quarto);
    setFormReserva({ 
        hospedeNome: user?.nome || "", 
        hospedeEmail: user?.email || "", 
        dtInicio: "", 
        dtFim: "", 
        observacoes: "" 
    });
    setModalBooking(true);
    setDatasOcupadas([]);

    try {
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const res = await reservaApi.quartosOcupados(start, end);
        const filtradas = res.data.filter(r => r.idQuarto === quarto.idQuarto);
        setDatasOcupadas(filtradas);
    } catch (e) {
        console.error("Erro ao carregar datas ocupadas", e);
    }
  };

  const handleReserva = async (e) => {
    e.preventDefault();
    if (!formReserva.dtInicio || !formReserva.dtFim) {
        toast.warning("Selecione as datas de entrada e saída.");
        return;
    }
    if (new Date(formReserva.dtFim) <= new Date(formReserva.dtInicio)) {
        toast.error("A data de saída deve ser posterior à data de entrada.");
        return;
    }

    setReservando(true);
    try {
      // Formatar de yyyy-MM-dd para dd-MM-yyyy conforme o backend espera
      const formatDateForBackend = (d) => {
          if (!d) return "";
          const [y, m, d_] = d.split('-');
          return `${d_}-${m}-${y}`;
      };

      const payload = {
        hospedeNome: formReserva.hospedeNome,
        hospedeEmail: formReserva.hospedeEmail,
        observacoes: formReserva.observacoes,
        dtInicio: formatDateForBackend(formReserva.dtInicio),
        dtFim: formatDateForBackend(formReserva.dtFim),
        idQuarto: quartoSelecionado.idQuarto,
        idUsuario: user?.id || user?.idUsuario || null 
      };
      await reservaApi.create(payload);
      toast.success(`Reserva confirmada! Um e-mail foi enviado para ${formReserva.hospedeEmail}.`);
      setModalBooking(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao realizar reserva. Verifique a disponibilidade para estas datas.");
    } finally {
      setReservando(false);
    }
  };


  // Get current date for min-date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#faf8ff] text-[#131b30] min-h-screen flex flex-col font-['Plus_Jakarta_Sans']">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-4 md:px-8 h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-10 bg-[#006972] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#006972]/20 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-2xl">apartment</span>
          </div>
          <div className="text-xl font-extrabold tracking-tighter text-[#006972] hidden sm:block">
             GrandHotel
          </div>
        </Link>

        {/* Links centrais — agora centralizados de forma absoluta */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
          <a href="#" className="text-[#006972] font-black border-b-2 border-[#006972] pb-1 text-sm tracking-tight">Acomodações</a>
          {isAuthenticated && (
            <Link to="/meus-agendamentos" className="text-slate-500 hover:text-[#006972] transition-colors text-sm font-bold tracking-tight">Meus Agendamentos</Link>
          )}
        </div>
        {/* Ações — adaptadas para mobile */}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              {/* Desktop: mostra Criar Conta + Entrar */}
              <Link to="/cadastro" className="hidden md:block px-5 py-2.5 text-slate-600 hover:text-[#006972] text-[10px] font-black uppercase tracking-widest transition-all">
                Criar Conta
              </Link>
              <Link to="/login-cliente" className="flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3 bg-[#006972] hover:bg-[#004f56] text-white rounded-full text-xs font-black transition-all active:scale-95 shadow-lg">
                <span className="material-symbols-outlined text-sm md:hidden">login</span>
                <span className="hidden md:inline">Entrar no Portal</span>
                <span className="md:hidden">Entrar</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-xs font-bold text-[#006972] uppercase tracking-widest bg-[#006972]/5 px-4 py-2 rounded-full">Olá, {user?.nome?.split(' ')[0]}</span>
              <button 
                onClick={() => { logout(); window.location.reload(); }}
                className="p-2 md:px-4 md:py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <span className="material-symbols-outlined text-sm md:hidden">logout</span>
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          )}
          <Link 
            to="/login"
            className="px-4 md:px-6 py-2.5 md:py-3 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-black transition-all active:scale-95 shadow-lg"
          >
            <span className="md:hidden">Staff</span>
            <span className="hidden md:inline">Área Staff</span>
          </Link>
        </div>
      </nav>

      <main className="pt-16 md:pt-20">
        {/* Hero Banner */}
        <section className="relative h-[600px] md:h-[700px] flex items-center px-6 md:px-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Luxury hotel lobby"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#131b30]/90 via-[#131b30]/60 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-3xl text-white pb-16 md:pb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8edce6]/20 backdrop-blur-md rounded-full mb-6 md:mb-8 border border-white/10">
               <span className="material-symbols-outlined text-[#8edce6] text-lg">verified</span>
               <span className="text-[10px] uppercase font-black tracking-[0.2em]">Oásis Urbano • Luxo • Conforto</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 leading-[1]">
              Sua jornada de <br/>
              <span className="text-[#8edce6]">serenidade</span> <br/>
              começa aqui.
            </h1>
            <p className="text-base md:text-xl opacity-95 font-medium max-w-xl mb-10 md:mb-12 leading-relaxed">
              Descubra um refúgio de sofisticação onde cada detalhe foi planejado para proporcionar sua melhor estadia.
            </p>
            <div className="flex flex-wrap gap-4">
                 <a href="#quartos" className="bg-[#006972] text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black text-sm shadow-2xl shadow-[#006972]/40 hover:scale-105 transition-all">
                    Visualizar Acomodações
                 </a>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="px-4 md:px-8 -mt-16 md:-mt-24 relative z-20">
          <div className="max-w-6xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-[#131b30]/20 p-4 md:p-6 border border-slate-100">
            {/* Desktop layout: em linha */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex-1 flex items-center gap-6 px-10 py-6 border-r border-slate-100 group">
                 <span className="material-symbols-outlined text-[#006972] text-4xl group-hover:rotate-12 transition-transform">calendar_today</span>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Entrada</span>
                    <input 
                      className="bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-slate-800" 
                      type="date" 
                      min={today} 
                      value={dtBuscaInicio}
                      onChange={e => setDtBuscaInicio(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 flex items-center gap-6 px-10 py-6 border-r border-slate-100 group">
                 <span className="material-symbols-outlined text-[#006972] text-4xl group-hover:rotate-12 transition-transform">calendar_month</span>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Saída</span>
                    <input 
                      className="bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-slate-800" 
                      type="date" 
                      min={dtBuscaInicio || today} 
                      value={dtBuscaFim}
                      onChange={e => setDtBuscaFim(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 flex items-center gap-6 px-10 py-6 group">
                 <span className="material-symbols-outlined text-[#006972] text-4xl group-hover:rotate-12 transition-transform">person_add</span>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Hóspedes</span>
                    <input className="bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-slate-800 w-full" placeholder="Quantos?" type="number" min="1" defaultValue={2} />
                 </div>
              </div>
              <button 
                onClick={handleBuscar}
                className="bg-gradient-to-br from-[#006972] to-[#004f56] text-white px-16 py-7 rounded-[2rem] font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-[#006972]/30"
              >
                Verificar
              </button>
            </div>
            {/* Mobile layout: em grade 2x2 */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              <div className="col-span-1 flex flex-col bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Entrada</span>
                <input 
                  className="bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-slate-800 w-full" 
                  type="date" 
                  min={today}
                  value={dtBuscaInicio}
                  onChange={e => setDtBuscaInicio(e.target.value)}
                />
              </div>
              <div className="col-span-1 flex flex-col bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Saída</span>
                <input 
                  className="bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-slate-800 w-full" 
                  type="date" 
                  min={dtBuscaInicio || today}
                  value={dtBuscaFim}
                  onChange={e => setDtBuscaFim(e.target.value)}
                />
              </div>
              <div className="col-span-1 flex flex-col bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Hóspedes</span>
                <input className="bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-slate-800 w-full" type="number" min="1" defaultValue={2} />
              </div>
              <div className="col-span-1">
                <button 
                  onClick={handleBuscar}
                  className="w-full h-full bg-gradient-to-br from-[#006972] to-[#004f56] text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-[#006972]/30 py-3"
                >
                  Verificar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Grid */}
        <section id="quartos" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Cabeçalho centralizado */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#131b30] mb-4">Acomodações de Luxo</h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">Encontre o refúgio perfeito para sua próxima estadia inesquecível.</p>
            {/* Filtros centralizados */}
            <div className="flex justify-center mt-8">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                {["Todos", "Suítes", "Premium"].map(c => (
                  <button 
                    key={c}
                    onClick={() => setFiltro(c)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filtro === c ? "bg-white text-[#006972] shadow-sm" : "text-slate-500 hover:bg-white/50"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-[450px] animate-pulse border border-slate-100"></div>
              ))
            ) : (quartosDisponiveis).map((q) => (
              <div key={q.idQuarto} className="bg-white rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,105,114,0.1)] border border-slate-100">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src={q.fotoUrl || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"} 
                    alt={q.nome} 
                  />
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
                    <span className="text-[10px] font-black text-[#006972] uppercase tracking-widest">{q.tipo || "Premium"}</span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-[#131b30] group-hover:text-[#006972] transition-colors">{q.nome}</h3>
                    <div className="flex items-center gap-1.5 text-[#006972] bg-[#8edce6]/30 px-3 py-1 rounded-xl">
                      <span className="material-symbols-outlined text-base fill-1">star</span>
                      <span className="text-sm font-black">{q.avaliacao || "5.0"}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                    {q.descricao || "Experiência de luxo com vista panorâmica e acabamento de alto padrão para seu total descanso."}
                  </p>

                  <div className="flex gap-4 mb-8">
                    { (q.tags || "Wi-Fi, Piscina, Ar").split(",").map(tag => (
                       <div key={tag} className="flex items-center gap-1.5 text-slate-400 group-hover:text-[#006972] transition-colors">
                          <span className="text-[10px] font-black uppercase tracking-tighter">{tag.trim()}</span>
                       </div>
                    ))}
                  </div>

                  <div className="mt-auto flex justify-between items-center border-t border-slate-50 pt-6">
                    <div>
                      <span className="text-3xl font-black text-[#006972]">
                         {q.valorDiaria?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-xs text-slate-400 font-bold tracking-tight block mt-1 uppercase">por noite</span>
                    </div>
                    <button 
                       onClick={() => abrirReserva(q)}
                       className="bg-[#006972] text-white px-8 py-4 rounded-2xl font-black text-sm hover:brightness-110 transition-all shadow-lg shadow-[#006972]/20 active:scale-95"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Booking Modal */}
      {modalBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b30]/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <button onClick={() => setModalBooking(false)} className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="mb-10 text-center">
                    <h3 className="text-3xl font-black text-[#131b30] mb-2">Finalizar Reserva</h3>
                    <p className="text-slate-500 font-medium">Você selecionou o <span className="text-[#006972] font-black">{quartoSelecionado?.nome}</span></p>
                </div>

                <form onSubmit={handleReserva} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                        <input 
                            required
                            value={formReserva.hospedeNome}
                            onChange={e => setFormReserva({...formReserva, hospedeNome: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold placeholder:text-slate-300" 
                            placeholder="Seu nome como no documento"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail para Confirmação</label>
                        <input 
                            required
                            type="email"
                            value={formReserva.hospedeEmail}
                            onChange={e => setFormReserva({...formReserva, hospedeEmail: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold placeholder:text-slate-300" 
                            placeholder="exemplo@email.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Check-in</label>
                            <input 
                                required
                                type="date"
                                min={today}
                                value={formReserva.dtInicio}
                                onChange={e => setFormReserva({...formReserva, dtInicio: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Check-out</label>
                            <input 
                                required
                                type="date"
                                min={formReserva.dtInicio || today}
                                value={formReserva.dtFim}
                                onChange={e => setFormReserva({...formReserva, dtFim: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" 
                            />
                        </div>
                    </div>

                    {datasOcupadas.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Datas Indisponíveis (Próximos 90 dias):</p>
                            <div className="flex flex-wrap gap-2">
                                {datasOcupadas.map((d, i) => (
                                    <span key={i} className="text-[10px] font-bold text-red-600 bg-red-200/50 px-2 py-1 rounded-md">
                                        {new Date(d.dtInicio).toLocaleDateString('pt-BR')} - {new Date(d.dtFim).toLocaleDateString('pt-BR')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Observações (Opcional)</label>
                        <textarea 
                            value={formReserva.observacoes}
                            onChange={e => setFormReserva({...formReserva, observacoes: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold placeholder:text-slate-300 min-h-[80px] resize-none" 
                            placeholder="Algum pedido especial?"
                        />
                    </div>

                    <button 
                        disabled={reservando}
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#006972] to-[#004f56] text-white py-6 rounded-[2rem] font-black text-base shadow-xl shadow-[#006972]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {reservando ? "Confirmando na nuvem..." : "Confirmar Minha Reserva"}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        Ao confirmar, você concorda com nossos termos de estadia.
                    </p>
                </form>
            </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-20 px-8 bg-[#131b30] text-white mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
                <div className="text-3xl font-black mb-6 text-[#8edce6]">GrandHotel</div>
                <p className="text-slate-400 font-medium max-w-sm leading-relaxed mb-8">
                    Elevando o conceito de hospitalidade com experiências imersivas e conforto inigualável ao redor do mundo.
                </p>
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-[#006972] transition-colors cursor-pointer group">
                     <span className="material-symbols-outlined text-slate-400 group-hover:text-white">social_leaderboard</span>
                  </div>
                  <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-[#006972] transition-colors cursor-pointer group">
                     <span className="material-symbols-outlined text-slate-400 group-hover:text-white">language</span>
                  </div>
                </div>
            </div>
            <div>
                 <h4 className="font-black text-lg mb-6">Explore</h4>
                 <ul className="space-y-4 text-slate-400 font-bold text-sm">
                    <li><a href="#" className="hover:text-[#8edce6] transition-colors">Início</a></li>
                    <li><a href="#quartos" className="hover:text-[#8edce6] transition-colors">Nossos Quartos</a></li>
                 </ul>
            </div>
            <div>
                 <h4 className="font-black text-lg mb-6">Suporte</h4>
                 <ul className="space-y-4 text-slate-400 font-bold text-sm">
                    <li><a href="#" className="hover:text-[#8edce6] transition-colors">Contato</a></li>
                 </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-bold">© 2026 Grand Hotel. Desenvolvido com foco na excelência.</p>
            <div className="flex gap-8 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <span>Brasil</span>
                <span>Internacional</span>
            </div>
        </div>
      </footer>
    </div>
  );
}
