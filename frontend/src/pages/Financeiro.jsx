import { useState, useMemo } from "react";

export default function Financeiro() {
  const [fluxo, setFluxo] = useState([
    { id: 1, descricao: "Reserva #502 - Maria Silva", valor: 350.50, tipo: "receita", metodo: "PIX", data: "2026-03-22" },
    { id: 2, descricao: "Consumo Frigobar - Quarto 201", valor: 45.00, tipo: "receita", metodo: "Cartão", data: "2026-03-22" },
    { id: 3, descricao: "Reposição Lavanderia (Gasto)", valor: -120.00, tipo: "despesa", metodo: "Dinheiro", data: "2026-03-21" }
  ]);

  const totais = useMemo(() => {
    const receitas = fluxo.filter(f => f.tipo === "receita").reduce((acc, f) => acc + f.valor, 0);
    const despesas = fluxo.filter(f => f.tipo === "despesa").reduce((acc, f) => acc + f.valor, 0);
    return { receitas, despesas, saldo: receitas + despesas };
  }, [fluxo]);

  return (
    <div className="space-y-6">
      <div className="bg-[#131b30] p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/5 text-[180px] rotate-12">account_balance_wallet</span>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
           <div>
              <h2 className="text-sm font-black uppercase text-white/40 mb-2 tracking-[0.2em]">Saldo de Caixa Operacional</h2>
              <p className="text-5xl font-black">{totais.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
           </div>
           <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                 <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Entradas</p>
                 <p className="text-xl font-black">{totais.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                 <p className="text-[10px] font-black uppercase text-red-400 mb-1">Saídas</p>
                 <p className="text-xl font-black">{Math.abs(totais.despesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black">Movimentações Recentes</h3>
            <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all">Exportar PDF</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                <th className="px-10 py-5">Descrição</th>
                <th className="px-10 py-5">Data</th>
                <th className="px-10 py-5">Método</th>
                <th className="px-10 py-5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fluxo.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-4 font-bold text-sm">{f.descricao}</td>
                  <td className="px-10 py-4 text-xs text-slate-500 font-bold">{f.data}</td>
                  <td className="px-10 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{f.metodo}</span></td>
                  <td className={`px-10 py-4 text-right font-black ${f.tipo === 'receita' ? "text-emerald-500" : "text-red-500"}`}>
                    {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
