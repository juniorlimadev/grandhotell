import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Manutencao() {
  const [itens, setItens] = useState([
    { id: 1, quarto: "Luxo 101", motivo: "Ar condicionado parou", status: "Aberta", data: "2026-03-22" },
    { id: 2, quarto: "Suíte 505", motivo: "Vazamento no banheiro", status: "Em progresso", data: "2026-03-21" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">build</span>
            Ordens de Manutenção
          </h2>
          <p className="text-slate-500 font-medium italic">Gestão de reparos e conservação das acomodações.</p>
        </div>
        <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20">Novo Chamado</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itens.map(it => (
          <div key={it.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest ${it.status === 'Aberta' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
               {it.status}
            </div>
            <h4 className="font-black text-lg mb-1">{it.quarto}</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">{it.data}</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-6">
               <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic">"{it.motivo}"</p>
            </div>
            <div className="flex gap-2">
               <button className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-all">Relatar Progresso</button>
               <button onClick={() => toast.success("Manutenção concluída! Quarto liberado.")} className="flex-1 py-3 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Liberar</button>
            </div>
          </div>
        ))}
      </div>
      
      {itens.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
           <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">construction</span>
           <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Tudo em perfeitas condições</p>
        </div>
      )}
    </div>
  );
}
