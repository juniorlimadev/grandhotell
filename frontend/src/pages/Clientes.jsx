import { useState, useEffect } from "react";
import { usuarioApi } from "../services/api";
import { toast } from "react-toastify";
import { formatDate } from "../utils/date-utils";

export default function Clientes() {
  const [lista, setLista] = useState({ content: [], totalElements: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  const carregar = async (page = 0) => {
    setLoading(true);
    try {
      // O backend pode não ter um endpoint específico para filtrar por cargo, 
      // então carregamos usuários e filtramos no frontend ou usamos o endpoint de lista comum.
      const res = await usuarioApi.list(page, 100); // Pegamos uma lista maior para filtrar
      const clientesApenas = (res.data.content || []).filter(u => 
        u.cargos && (
            (Array.isArray(u.cargos) && u.cargos.length === 1 && (u.cargos[0] === "USER" || u.cargos[0]?.titulo === "USER")) ||
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
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{c.nome}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{c.email}</p>
                  </div>
               </div>

               <div className="space-y-4 relative z-10 pb-4 border-b border-slate-50 dark:border-slate-800 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Nascimento</span>
                     <span className="text-slate-700 dark:text-slate-200">{formatDate(c.dataNascimento)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Status</span>
                     <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">Ativo</span>
                  </div>
               </div>

               <div className="flex gap-2">
                  <button 
                    onClick={() => toast.info(`Relatórios para ${c.nome} em breve.`)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Histórico
                  </button>
                  <button 
                    onClick={() => toast.warning("Funcionalidade restrita.")}
                    className="size-11 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">block</span>
                  </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
