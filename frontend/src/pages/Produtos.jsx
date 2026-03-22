import { useState } from "react";
import { toast } from "react-toastify";

// Simulando um banco de produtos para o Grand Hotel
const INITIAL_PRODUCTS = [
  { id: 1, nome: "Água Mineral 500ml", preco: 5.50, categoria: "Bebidas", estoque: 120, icone: "water_drop" },
  { id: 2, nome: "Refrigerante Lata", preco: 8.00, categoria: "Bebidas", estoque: 85, icone: "liquor" },
  { id: 3, nome: "Cerveja Heineken 330ml", preco: 14.00, categoria: "Bebidas", estoque: 45, icone: "sports_bar" },
  { id: 4, nome: "Snack Batata Chips", preco: 12.00, categoria: "Snacks", estoque: 30, icone: "fastfood" },
  { id: 5, nome: "Kit Higiene Premium", preco: 25.00, categoria: "Serviços", estoque: 15, icone: "clean_hands" },
  { id: 6, nome: "Vinho Chileno 750ml", preco: 85.00, categoria: "Bebidas", estoque: 12, icone: "wine_bar" },
];

export default function Produtos() {
  const [produtos, setProdutos] = useState(INITIAL_PRODUCTS);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novoProduto, setNovoProduto] = useState({ nome: "", preco: "", categoria: "Bebidas", icone: "inventory_2" });

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const handleCreate = (e) => {
    e.preventDefault();
    const p = { ...novoProduto, id: Date.now(), preco: parseFloat(novoProduto.preco), estoque: 0 };
    setProdutos([p, ...produtos]);
    setModalAberto(false);
    toast.success(`${p.nome} cadastrado no inventário!`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tighter">
            <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
            Estoque de Consumo
          </h2>
          <p className="text-slate-500 font-medium">Gestão de itens do frigobar e serviços extras.</p>
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
            <button onClick={() => setModalAberto(true)} className="size-12 rounded-2xl bg-primary text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined font-black">add</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtrados.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-[80px] text-primary">{p.icone}</span>
                </div>
                
                <div className="size-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-slate-100 dark:ring-slate-700 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-2xl">{p.icone}</span>
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{p.categoria}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{p.nome}</h3>
                    <p className="text-2xl text-primary font-black tracking-tighter">R$ {p.preco.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Em Estoque</span>
                        <span className={`text-sm font-black ${p.estoque < 20 ? 'text-red-500' : 'text-slate-900 dark:text-slate-200'}`}>{p.estoque} un.</span>
                    </div>
                    <button className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 hover:text-primary transition-colors rounded-xl border border-transparent hover:border-primary/20">Lançar p/ Quarto</button>
                </div>
            </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black tracking-tight">Novo Item</h3>
               <button onClick={() => setModalAberto(false)} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all"><span className="material-symbols-outlined">close</span></button>
             </div>
             
             <form onSubmit={handleCreate} className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome do Produto</label>
                  <input type="text" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all" required placeholder="Ex: Chocolate Suíço" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preço (R$)</label>
                    <input type="number" step="0.01" value={novoProduto.preco} onChange={e => setNovoProduto({...novoProduto, preco: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                    <select value={novoProduto.categoria} onChange={e => setNovoProduto({...novoProduto, categoria: e.target.value})} className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-primary transition-all cursor-pointer">
                       <option value="Bebidas">Bebidas</option>
                       <option value="Snacks">Snacks</option>
                       <option value="Serviços">Serviços</option>
                    </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-primary text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">Salvar no Inventário</button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
