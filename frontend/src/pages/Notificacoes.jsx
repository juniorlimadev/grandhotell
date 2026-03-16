import { useState } from "react";

export default function Notificacoes() {
  const [notifications] = useState([
    { id: 1, text: "Nova reserva realizada no quarto 102", time: "Há 5 min", type: "reserva", date: "15/03/2026" },
    { id: 2, text: "Check-out pendente para amanhã", time: "Há 2 horas", type: "alerta", date: "15/03/2026" },
    { id: 3, text: "Limpeza concluída no quarto 205", time: "Há 5 horas", type: "limpeza", date: "15/03/2026" },
    { id: 4, text: "Novo usuário registrado: João Silva", time: "Há 1 dia", type: "sistema", date: "14/03/2026" },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Todas as Notificações</h2>
        <p className="text-slate-500 dark:text-slate-400">Histórico completo de atividades do sistema</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((n) => (
            <div key={n.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex items-start gap-4">
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                n.type === 'reserva' ? 'bg-emerald-100 text-emerald-600' : 
                n.type === 'alerta' ? 'bg-orange-100 text-orange-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <span className="material-symbols-outlined">{
                  n.type === 'reserva' ? 'check_circle' : 
                  n.type === 'alerta' ? 'warning' : 'info'
                }</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-slate-900 dark:text-white">{n.text}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.date}</span>
                </div>
                <p className="text-sm text-slate-500">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
