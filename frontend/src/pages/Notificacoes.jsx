import { useState, useEffect } from "react";

export default function Notificacoes() {
  const [filter, setFilter] = useState("todos");
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("grandhotel_notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((n) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
      } catch {
        // ignora erro e volta para padrão
      }
    }
    const agora = new Date();
    const initial = [
      { id: 1, text: "Nova reserva realizada no quarto 102", timestamp: new Date(agora.getTime() - 5 * 60 * 1000), type: "reserva", date: new Date(agora.getTime() - 5 * 60 * 1000).toLocaleDateString('pt-BR') },
      { id: 2, text: "Check-out pendente para amanhã", timestamp: new Date(agora.getTime() - 2 * 60 * 60 * 1000), type: "alerta", date: new Date(agora.getTime() - 2 * 60 * 60 * 1000).toLocaleDateString('pt-BR') },
      { id: 3, text: "Limpeza concluída no quarto 205", timestamp: new Date(agora.getTime() - 6 * 60 * 60 * 1000), type: "limpeza", date: new Date(agora.getTime() - 6 * 60 * 60 * 1000).toLocaleDateString('pt-BR') },
      { id: 4, text: "Novo usuário registrado: João Silva", timestamp: new Date(agora.getTime() - 24 * 60 * 60 * 1000), type: "sistema", date: new Date(agora.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') },
    ];
    localStorage.setItem("grandhotel_notifications", JSON.stringify(initial));
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(
      "grandhotel_notifications",
      JSON.stringify(
        notifications.map((n) => ({
          ...n,
          timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp,
        }))
      )
    );
  }, [notifications]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffH < 24) return `Há ${diffH} hora${diffH > 1 ? "s" : ""}`;
    if (diffD === 1) return "Ontem";
    return `Há ${diffD} dias`;
  };


  const filteredNotifications = filter === "todos" 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Todas as Notificações</h2>
          <p className="text-slate-500 dark:text-slate-400">Histórico completo de atividades do sistema</p>
        </div>
        <button 
          onClick={clearNotifications}
          className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
        >
          Limpar histórico
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["todos", "reserva", "alerta", "limpeza", "sistema"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              filter === t 
                ? "bg-primary text-slate-900 shadow-lg shadow-primary/20" 
                : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">notifications_off</span>
              <p className="text-slate-500 font-medium">Nenhuma notificação encontrada.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div key={n.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${
                  n.type === 'reserva' ? 'bg-emerald-100 text-emerald-600' : 
                  n.type === 'alerta' ? 'bg-orange-100 text-orange-600' :
                  n.type === 'limpeza' ? 'bg-blue-100 text-blue-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined">{
                    n.type === 'reserva' ? 'check_circle' : 
                    n.type === 'alerta' ? 'warning' : 
                    n.type === 'limpeza' ? 'cleaning_services' : 'info'
                  }</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-900 dark:text-white">{n.text}</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.date}</span>
                  </div>
                  <p className="text-sm text-slate-500">{getTimeAgo(n.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

