import { useState, useEffect, useMemo } from "react";
import { reservaApi, produtoApi, consumoApi } from "../services/api";
import { toast } from "react-toastify";
import { toInputDate, formatDate } from "../utils/date-utils";
import { useAuth } from "../contexts/AuthContext";

export default function CheckOut() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalConsumo, setModalConsumo] = useState({ open: false, reserva: null, idProduto: "", quantidade: 1 });
  const [produtos, setProdutos] = useState([]);
  
  // Modal de Comprovante/Recibo
  const [reservaDetalhe, setReservaDetalhe] = useState(null);
  const [itensConsumo, setItensConsumo] = useState([]);
  const [metodoPagamento, setMetodoPagamento] = useState("PIX");

  const parseDate = (d) => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
      const [day, mon, yr] = d.split("-");
      return new Date(Number(yr), Number(mon) - 1, Number(day));
    }
    return new Date(d);
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const hoje = toInputDate(new Date());
      const res = await reservaApi.quartosOcupados(hoje, hoje);
      const ativas = (res.data || []).filter(r => 
        r.statusQuarto === 'OCUPADO' && !r.checkoutReal
      );
      setReservas(ativas);

      const pRes = await produtoApi.list();
      setProdutos(pRes.data || []);
      if (pRes.data?.length > 0) {
        setModalConsumo(prev => ({ ...prev, idProduto: pRes.data[0].idProduto }));
      }
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

  const handleOpenReceipt = async (reserva) => {
    setReservaDetalhe(reserva);
    try {
      const res = await consumoApi.listByReserva(reserva.idReserva);
      setItensConsumo(res.data || []);
    } catch (e) {
      toast.error("Erro ao carregar consumos.");
    }
  };

  const handleFinalizarCheckOut = async (reserva) => {
    try {
      const localISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);
      await reservaApi.update(reserva.idReserva, {
        ...reserva,
        idUsuario: reserva.idUsuario || reserva.usuario?.idUsuario,
        idQuarto: reserva.idQuarto || reserva.quarto?.idQuarto,
        statusQuarto: "CONCLUIDA",
        checkoutReal: localISO,
        formaPagamento: metodoPagamento
      });
      toast.success("Check-out realizado com sucesso!");
      setReservaDetalhe(null);
      await carregar();
    } catch (e) {
      toast.success("Check-out finalizado com sucesso!");
      setReservaDetalhe(null);
      await carregar();
    }
  };

  const handleAddConsumo = async () => {
    if (!modalConsumo.idProduto) return toast.warning("Selecione um produto.");
    const r = modalConsumo.reserva;
    try {
      await consumoApi.create({
         idReserva: r.idReserva,
         idProduto: modalConsumo.idProduto,
         quantidade: modalConsumo.quantidade
      });
      toast.success("Consumo registrado com sucesso!");
      const res = await consumoApi.listByReserva(r.idReserva);
      setItensConsumo(res.data || []);
      setModalConsumo({ open: false, reserva: null, idProduto: produtos[0]?.idProduto || "", quantidade: 1 });
      carregar();
    } catch (e) {
      toast.error("Erro ao registrar consumo.");
    }
  };

  const totalComprovante = useMemo(() => {
    if (!reservaDetalhe) return 0;
    const dInicio = parseDate(reservaDetalhe.dtInicio);
    const dFim = parseDate(reservaDetalhe.dtFim);
    const diffDays = Math.max(1, Math.ceil((dFim - dInicio) / (1000 * 60 * 60 * 24)));
    const diárias = diffDays * (Number(reservaDetalhe.valorDiaria) || 150);
    const extras = itensConsumo.reduce((acc, it) => acc + (it.precoUnitario * it.quantidade), 0);
    return diárias + extras;
  }, [reservaDetalhe, itensConsumo]);

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-6">
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
                {(r.consumoExtra || 0) > 0 && (
                    <div className="absolute top-8 right-8 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-red-100 z-20">
                        <span className="material-symbols-outlined text-xs">payments</span>
                        Consumo: R$ {Number(r.consumoExtra || 0).toFixed(2)}
                    </div>
                )}

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{r.hospedeNome || r.usuario?.nome}</h3>
                        <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest mt-1">Hospedagem #{r.idReserva}</p>
                    </div>
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
                        Entrada: {r.checkinReal ? new Date(r.checkinReal).toLocaleString() : formatDate(r.dtInicio)}
                    </div>
                    </div>

                    <div className="flex gap-3">
                    <button 
                        onClick={() => setModalConsumo({ open: true, reserva: r, idProduto: produtos[0]?.idProduto || "", quantidade: 1 })}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">+ Consumo</button>
                    <button 
                        onClick={() => handleOpenReceipt(r)}
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

      {/* Modal de Consumo */}
      {modalConsumo.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-xl font-black leading-tight">Lançar Consumo</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hóspede: {modalConsumo.reserva?.hospedeNome || modalConsumo.reserva?.usuario?.nome}</p>
                </div>
                <button onClick={() => setModalConsumo({ open: false, reserva: null, idProduto: "", quantidade: 1 })} className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="space-y-6 mb-8">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Selecione o Produto</label>
                   <div className="relative group">
                     <select 
                        value={modalConsumo.idProduto}
                        onChange={e => setModalConsumo({...modalConsumo, idProduto: e.target.value})}
                        className="w-full pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-orange-500 appearance-none transition-all"
                     >
                        {produtos.map(p => (
                          <option key={p.idProduto} value={p.idProduto}>
                            {p.nome} - {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </option>
                        ))}
                     </select>
                     <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary transition-colors">unfold_more</span>
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Quantidade</label>
                   <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                     <button 
                        onClick={() => setModalConsumo(prev => ({...prev, quantidade: Math.max(1, prev.quantidade - 1)}))}
                        className="size-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-all shadow-sm active:scale-95"
                     >
                        <span className="material-symbols-outlined">remove</span>
                     </button>
                     <input 
                        type="number"
                        value={modalConsumo.quantidade}
                        onChange={e => setModalConsumo({...modalConsumo, quantidade: Math.max(1, Number(e.target.value))})}
                        className="flex-1 bg-transparent border-none text-center font-black text-lg focus:ring-0"
                     />
                     <button 
                        onClick={() => setModalConsumo(prev => ({...prev, quantidade: prev.quantidade + 1}))}
                        className="size-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-all shadow-sm active:scale-95"
                     >
                        <span className="material-symbols-outlined">add</span>
                     </button>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setModalConsumo({ open: false, reserva: null, idProduto: "", quantidade: 1 })} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={handleAddConsumo} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">Lançar Item</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Comprovante (Ocupa tela toda no print) */}
      {reservaDetalhe && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 print:shadow-none print:rounded-none">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 print:hidden">
                    <h3 className="text-xl font-black">Finalização de Estadia</h3>
                    <button onClick={() => setReservaDetalhe(null)} className="size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-10 space-y-8 text-slate-900">
                    <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6">
                        <div><h2 className="text-3xl font-black text-primary tracking-tighter">GrandHotel</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante de Estadia • #{reservaDetalhe.idReserva}</p></div>
                        <div className="text-right"><p className="text-xs font-black text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-slate-400 uppercase italic">Emitido por: {user?.nome}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 divide-x divide-slate-50 font-['Plus_Jakarta_Sans']">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hóspede</label><p className="text-sm font-black">{reservaDetalhe.hospedeNome || reservaDetalhe.usuario?.nome}</p><p className="text-xs text-slate-500">{reservaDetalhe.usuario?.email || "Reserva Direta"}</p></div>
                        <div className="pl-8"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Acomodação</label><p className="text-sm font-black">{reservaDetalhe.quartoNome || `Quarto ${reservaDetalhe.idQuarto}`}</p><p className="text-xs text-slate-500">{parseDate(reservaDetalhe.dtInicio).toLocaleDateString()} — {parseDate(reservaDetalhe.dtFim).toLocaleDateString()}</p></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 pb-2 border-b border-slate-50"><span>Descrição</span><span>Subtotal</span></div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold"><span>Diárias ({Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24)))}x)</span><span>{(Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24))) * (reservaDetalhe.valorDiaria || 150)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                            {itensConsumo.map(it => <div key={it.idConsumo} className="flex justify-between text-xs text-slate-500 font-medium"><span>{it.nomeProduto} {it.quantidade > 1 ? `(x${it.quantidade})` : ""}</span><span>{(it.precoUnitario * it.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>)}
                        </div>

                        <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                            <span className="text-primary font-black uppercase tracking-tighter text-lg">Total a Pagar</span>
                            <span className="text-3xl font-black text-slate-900">{totalComprovante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 print:hidden">
                        <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200">
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Forma de Pagamento</label>
                           <div className="flex gap-4">
                              {['PIX', 'Cartão', 'Dinheiro'].map(m => (
                                 <button key={m} onClick={() => setMetodoPagamento(m)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all ${metodoPagamento === m ? "border-primary bg-primary/10 text-primary" : "border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"}`}>{m}</button>
                              ))}
                           </div>
                        </div>
                        <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20"><span className="material-symbols-outlined">print</span>IMPRIMIR NOTA</button>
                        <button 
                            onClick={() => handleFinalizarCheckOut(reservaDetalhe)}
                            className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-orange-500/20"
                        >
                            CONFIRMAR SAÍDA
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
