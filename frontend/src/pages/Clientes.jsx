import { useState, useEffect } from "react";
import { usuarioApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { formatDate } from "../utils/date-utils";

export default function Clientes() {
  const [lista, setLista] = useState({ content: [], totalElements: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [abrirSenha, setAbrirSenha] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");

  const carregar = async (page = 0) => {
    setLoading(true);
    try {
      const res = await usuarioApi.list(page, 100);
      const clientesApenas = (res.data.content || []).filter(u => 
        u.cargos && (
            (Array.isArray(u.cargos) && (u.cargos.includes("USER") || u.cargos.includes("CLIENTE"))) ||
            (!Array.isArray(u.cargos) && (u.cargos === "USER" || u.cargos?.titulo === "USER"))
        )
      );
      setLista({
        ...res.data,
        content: clientesApenas,
        totalElements: clientesApenas.length
      });
    } catch (e) {
      toast.error("Erro ao carregar lista de clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar(0);
  }, []);

  const verHistorico = async (cliente) => {
    setClienteSelecionado(cliente);
    setLoadingHistorico(true);
    setHistorico([]);
    try {
        const res = await reservaApi.getByUsuario(cliente.nome);
        setHistorico(res.data.Reservas || []);
    } catch (e) {
        toast.error("Não foi possível carregar o histórico deste cliente.");
    } finally {
        setLoadingHistorico(false);
    }
  };

  const toggleBloqueio = async (id) => {
     try {
        await usuarioApi.toggleStatus(id);
        toast.success("Status do usuário atualizado!");
        carregar();
     } catch (e) {
        toast.error("Erro ao alterar status do usuário.");
     }
  };

  const redefinirSenha = async () => {
     if (!novaSenha) return toast.warning("Digite uma nova senha.");
     try {
        await usuarioApi.adminResetPassword(abrirSenha.idUsuario, novaSenha);
        toast.success(`Senha de ${abrirSenha.nome} alterada!`);
        setAbrirSenha(null);
        setNovaSenha("");
     } catch (e) {
        toast.error("Erro ao redefinir senha.");
     }
  };

  const clientesFiltrados = (lista.content || []).filter(c => 
    c.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    c.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Base de Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerenciamento de hóspedes cadastrados no sistema.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full md:w-80 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />
          ))
        ) : clientesFiltrados.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-800 mb-4">person_search</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum cliente encontrado</p>
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div key={c.idUsuario} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden">
               {/* Decorative element */}
               <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
               
               <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="size-14 rounded-2xl bg-primary text-slate-900 font-black text-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{c.nome}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate">{c.email}</p>
                  </div>
                  <button 
                    onClick={() => setAbrirSenha(c)}
                    className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">key</span>
                  </button>
               </div>

               <div className="space-y-4 relative z-10 pb-4 border-b border-slate-50 dark:border-slate-800 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Nascimento</span>
                     <span className="text-slate-700 dark:text-slate-200">{formatDate(c.dataNascimento)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Status</span>
                     <span className={c.ativo !== false ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md" : "text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md"}>
                        {c.ativo !== false ? "Ativo" : "Bloqueado"}
                     </span>
                  </div>
               </div>

               <div className="flex gap-2">
                  <button 
                    onClick={() => verHistorico(c)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Histórico
                  </button>
                  <button 
                    onClick={() => toggleBloqueio(c.idUsuario)}
                    className={`size-11 flex items-center justify-center rounded-xl transition-all ${c.ativo !== false ? 'bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    title={c.ativo !== false ? "Bloquear" : "Desbloquear"}
                  >
                    <span className="material-symbols-outlined text-lg">{c.ativo !== false ? 'block' : 'check_circle'}</span>
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Histórico */}
      {clienteSelecionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setClienteSelecionado(null)}></div>
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Histórico de {clienteSelecionado.nome}</h3>
                        <p className="text-sm text-slate-500">Listagem de todas as reservas vinculadas.</p>
                    </div>
                    <button onClick={() => setClienteSelecionado(null)} className="size-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    {loadingHistorico ? (
                        <div className="space-y-4">
                            {[1,2].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : historico.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                            <span className="material-symbols-outlined text-4xl mb-2">hotel_class</span>
                            <p className="text-xs font-black uppercase">Nenhuma reserva encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historico.map(h => (
                                <div key={h.idReserva} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Quarto {h.idQuarto}</h4>
                                        <p className="text-xs text-slate-500">{formatDate(h.dtInicio)} — {formatDate(h.dtFim)}</p>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-emerald-500">#{h.idReserva}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Modal Mudar Senha */}
      {abrirSenha && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAbrirSenha(null)}></div>
             <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 animate-in zoom-in-95">
                <h3 className="text-xl font-black mb-2">Mudar Senha</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">Defina uma nova senha para {abrirSenha.nome}.</p>
                <div className="space-y-4">
                    <input 
                        type="password"
                        placeholder="Nova senha secreta"
                        value={novaSenha}
                        onChange={e => setNovaSenha(e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button 
                        onClick={redefinirSenha}
                        className="w-full py-4 bg-primary text-slate-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        Confirmar Alteração
                    </button>
                    <button onClick={() => setAbrirSenha(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
