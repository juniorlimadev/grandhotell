import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { produtoApi } from "../services/api";

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [itemAtual, setItemAtual] = useState(null);
  const [formData, setFormData] = useState({ nome: "", preco: "", categoria: "Bebidas", icone: "inventory_2" });

  const loadProdutos = async () => {
    setLoading(true);
    try {
      const res = await produtoApi.list();
      setProdutos(res.data);
    } catch (err) {
      toast.error("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProdutos();
  }, []);

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const handleOpenModal = (p = null) => {
    if (p) {
      setItemAtual(p);
      setFormData({ nome: p.nome, preco: p.preco, categoria: p.categoria || "Bebidas", icone: p.icone || "inventory_2" });
    } else {
      setItemAtual(null);
      setFormData({ nome: "", preco: "", categoria: "Bebidas", icone: "inventory_2" });
    }
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (itemAtual) {
        await produtoApi.update(itemAtual.idProduto, { ...formData, preco: parseFloat(formData.preco) });
        toast.success(`${formData.nome} atualizado!`);
      } else {
        await produtoApi.create({ ...formData, preco: parseFloat(formData.preco) });
        toast.success(`${formData.nome} cadastrado!`);
      }
      setModalAberto(false);
      loadProdutos();
    } catch (err) {
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente desativar este produto?")) {
      try {
        await produtoApi.delete(id);
        toast.success("Produto desativado.");
        loadProdutos();
      } catch (err) {
        toast.error("Erro ao desativar produto.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tighter">
            <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
            Catálogo de Produtos
          </h2>
          <p className="text-slate-500 font-medium">Gestão de itens e serviços do hotel.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Buscar item..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all shadow-sm"
              />
            </div>
            <button onClick={() => handleOpenModal()} className="size-12 rounded-2xl bg-primary text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined font-black">add</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2rem]" />) : (
          filtrados.map(p => (
            <div key={p.idProduto} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-[80px] text-primary">{p.icone}</span>
                </div>
                
                <div className="size-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-slate-100 dark:ring-slate-700 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-2xl">{p.icone}</span>
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{p.categoria}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{p.nome}</h3>
                    <p className="text-2xl text-primary font-black tracking-tighter">R$ {parseFloat(p.preco).toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <button onClick={() => handleDelete(p.idProduto)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                    <button onClick={() => handleOpenModal(p)} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 hover:text-primary transition-colors rounded-xl border border-transparent hover:border-primary/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                    </button>
                </div>
            </div>
          ))
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black tracking-tight">{itemAtual ? "Editar Produto" : "Novo Produto"}</h3>
               <button onClick={() => setModalAberto(false)} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all"><span className="material-symbols-outlined">close</span></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome do Produto</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all" required placeholder="Ex: Chocolate Suíço" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preço (R$)</label>
                    <input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                    <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all cursor-pointer">
                       <option value="Bebidas">Bebidas</option>
                       <option value="Snacks">Snacks</option>
                       <option value="Serviços">Serviços</option>
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ícone (Material Icon)</label>
                  <input type="text" value={formData.icone} onChange={e => setFormData({...formData, icone: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all" required placeholder="water_drop, liquor, etc" />
               </div>
               <button type="submit" className="w-full py-4 bg-primary text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                 {itemAtual ? "Atualizar" : "Salvar no Inventário"}
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}

