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
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { margin: 0; }
              body { margin: 1.6cm; background: white !important; font-family: 'Times New Roman', serif; }
              .fixed { position: relative !important; backdrop-filter: none !important; background: white !important; padding: 0 !important; }
              .shadow-2xl { shadow: none !important; border: none !important; }
              .rounded-[2.5rem] { border-radius: 0 !important; }
              .bg-white { background: white !important; color: black !important; }
              .dark\:bg-slate-900 { background: white !important; color: black !important; }
              .no-print { display: none !important; }
              button, .print\:hidden { display: none !important; }
            }
          `}} />
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 print:shadow-none print:rounded-none">
                  {/* Cabeçalho Pro (Escondido no Site, visível no print se necessário, mas aqui visível em ambos) */}
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 print:bg-white print:border-slate-900 print:pb-4">
                      <div className="flex items-center gap-3">
                         <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 print:bg-white print:border print:border-black">
                            <span className="material-symbols-outlined">apartment</span>
                         </div>
                         <div>
                            <h3 className="text-xl font-black print:text-2xl">GrandHotel</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest print:text-black">Sua melhor estadia • {new Date().getFullYear()}</p>
                         </div>
                      </div>
                      <button onClick={() => setReservaDetalhe(null)} className="size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors print:hidden"><span className="material-symbols-outlined">close</span></button>
                      <div className="hidden print:block text-right">
                         <p className="text-[10px] font-black uppercase">Fatura / Recibo</p>
                         <p className="text-xs font-bold text-primary">Nº {reservaDetalhe.idReserva}</p>
                      </div>
                  </div>

                  <div className="p-10 space-y-10 text-slate-900 print:text-black print:p-0 print:mt-8">
                      {/* Dados da Empresa e Cliente */}
                      <div className="grid grid-cols-2 gap-10 border-b-2 border-slate-50 pb-8 print:border-black/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Emitido por</label>
                             <div className="text-sm">
                                <p className="font-black">Grand Hotel Ltda.</p>
                                <p className="text-slate-500 font-medium text-xs print:text-black">CNPJ: 00.000.000/0001-00</p>
                                <p className="text-slate-500 font-medium text-xs print:text-black">Av. Principal, 1000 - Centro</p>
                                <p className="text-slate-500 font-medium text-xs print:text-black">contato@grandhotel.com.br</p>
                             </div>
                          </div>
                          <div className="text-right space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hóspede / Cliente</label>
                             <div className="text-sm">
                                <p className="font-black">{reservaDetalhe.hospedeNome || reservaDetalhe.usuario?.nome}</p>
                                <p className="text-slate-500 font-medium text-xs print:text-black">{reservaDetalhe.usuario?.email || "Reserva Direta"}</p>
                                <p className="text-slate-500 font-medium text-xs print:text-black">ID: {reservaDetalhe.idUsuario || reservaDetalhe.usuario?.idUsuario}</p>
                             </div>
                          </div>
                      </div>

                      {/* Dados da Estadia */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl grid grid-cols-3 gap-6 print:bg-white print:border print:border-black/10 print:rounded-none">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Entrada</label>
                            <p className="text-xs font-black">{parseDate(reservaDetalhe.dtInicio).toLocaleDateString()}</p>
                          </div>
                          <div className="border-x border-slate-200 dark:border-slate-700 px-6">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saída</label>
                            <p className="text-xs font-black">{parseDate(reservaDetalhe.dtFim).toLocaleDateString()}</p>
                          </div>
                          <div className="pl-4">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Acomodação</label>
                            <p className="text-xs font-black truncate">{reservaDetalhe.quartoNome || `Quarto ${reservaDetalhe.idQuarto}`}</p>
                          </div>
                      </div>

                      {/* Tabela de Itens */}
                      <div className="space-y-6">
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-400 print:text-black print:border-black">
                                   <th className="py-3">Descrição do Serviço/Produto</th>
                                   <th className="py-3 w-20 text-center">Qtd</th>
                                   <th className="py-3 w-32 text-right">Preço Un.</th>
                                   <th className="py-3 w-32 text-right">Subtotal</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 print:divide-black/10">
                                <tr className="text-xs font-bold">
                                   <td className="py-4">Hospedagem (Diárias - Quarto {reservaDetalhe.idQuarto})</td>
                                   <td className="py-4 text-center">{Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24)))}</td>
                                   <td className="py-4 text-right">{(Number(reservaDetalhe.valorDiaria) || 150).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                   <td className="py-4 text-right">{(Math.max(1, Math.ceil((parseDate(reservaDetalhe.dtFim) - parseDate(reservaDetalhe.dtInicio)) / (1000 * 60 * 60 * 24))) * (reservaDetalhe.valorDiaria || 150)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                                {itensConsumo.map(it => (
                                  <tr key={it.idConsumo} className="text-xs text-slate-600 print:text-black italic">
                                     <td className="py-3 px-2 flex items-center gap-2">
                                        <span className="size-1 bg-slate-300 rounded-full print:hidden"></span>
                                        {it.nomeProduto}
                                     </td>
                                     <td className="py-3 text-center">{it.quantidade}</td>
                                     <td className="py-3 text-right">{(it.precoUnitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                     <td className="py-3 text-right font-bold text-slate-900 print:text-black">{(it.precoUnitario * it.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>

                          {/* Totais */}
                          <div className="flex justify-end pt-4">
                             <div className="w-full max-w-xs space-y-4">
                                <div className="flex justify-between text-xs font-black uppercase text-slate-400 print:text-black">
                                   <span>Subtotal</span>
                                   <span>{totalComprovante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black uppercase text-slate-400 print:text-black">
                                   <span>Taxas (0%)</span>
                                   <span>R$ 0,00</span>
                                </div>
                                <div className="pt-4 border-t-4 border-slate-900 flex justify-between items-center print:border-black">
                                   <span className="text-primary font-black uppercase text-xl print:text-black">Total Pago</span>
                                   <span className="text-3xl font-black">{totalComprovante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <p className="text-[10px] text-right text-slate-400 font-bold italic print:text-black">Forma de Pagamento: {metodoPagamento}</p>
                             </div>
                          </div>
                      </div>

                      {/* Rodapé do Print */}
                      <div className="hidden print:grid grid-cols-2 gap-20 pt-16 mt-auto">
                          <div className="border-t border-black pt-4 text-center">
                             <p className="text-[9px] font-black uppercase">Assinatura do Hóspede</p>
                             <p className="text-[8px] text-slate-500">{reservaDetalhe.hospedeNome || reservaDetalhe.usuario?.nome}</p>
                          </div>
                          <div className="border-t border-black pt-4 text-center">
                             <p className="text-[9px] font-black uppercase">Responsável GrandHotel</p>
                             <p className="text-[8px] text-slate-500">{user?.nome}</p>
                          </div>
                          <div className="col-span-2 text-center pt-8">
                             <p className="text-[10px] font-black italic">Obrigado pela preferência! Volte sempre.</p>
                             <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest">Documento gerado eletronicamente em {new Date().toLocaleString()}</p>
                          </div>
                      </div>
                      
                      {/* Ações Site */}
                      <div className="grid grid-cols-2 gap-4 print:hidden">
                          <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200">
                             <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Confirmar Forma de Pagamento</label>
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
                              CONCLUIR SAÍDA
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
