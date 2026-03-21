import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const STORAGE_KEY = "grandhotel_admin_logs";
const LOG_TYPES = ["todos", "login", "usuario", "reserva", "quarto", "sistema"];

const LOG_TYPE_CONFIG = {
  login:   { icon: "login",       bg: "bg-blue-100 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",    label: "Login" },
  usuario: { icon: "person",      bg: "bg-purple-100 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", label: "Usuário" },
  reserva: { icon: "event",       bg: "bg-emerald-100 dark:bg-emerald-500/10",text: "text-emerald-600 dark:text-emerald-400",label: "Reserva" },
  quarto:  { icon: "hotel",       bg: "bg-orange-100 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", label: "Quarto" },
  sistema: { icon: "settings",    bg: "bg-slate-100 dark:bg-slate-800",      text: "text-slate-600 dark:text-slate-400",   label: "Sistema" },
};

/**
 * Registra um log de atividade.
 * Exportado para ser chamado de outras partes do sistema.
 */
export function registrarLog(tipo, descricao, usuario = "Sistema") {
  const logs = obterLogs();
  const novoLog = {
    id: Date.now(),
    tipo,
    descricao,
    usuario,
    timestamp: new Date().toISOString(),
  };
  const atualizados = [novoLog, ...logs].slice(0, 200); // mantém os últimos 200 logs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
}

function obterLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getTimeAgo(iso) {
  if (!iso) return "";
  const now = new Date();
  const ts = new Date(iso);
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH   = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD   = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMin < 1)  return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffH < 24)   return `Há ${diffH} hora${diffH > 1 ? "s" : ""}`;
  if (diffD === 1)  return "Ontem";
  return `Há ${diffD} dias`;
}

export default function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  // Só ADMIN pode acessar
  const isAdmin = user?.cargos?.includes("ADMIN") || false;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  useEffect(() => {
    setLogs(obterLogs());
    const interval = setInterval(() => setLogs(obterLogs()), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtrados = logs.filter(l => {
    const matchTipo = filtro === "todos" || l.tipo === filtro;
    const matchBusca = !busca || l.descricao?.toLowerCase().includes(busca.toLowerCase()) || l.usuario?.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  const limparLogs = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLogs([]);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400">terminal</span>
            Logs do Sistema
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Histórico de atividades — visível apenas para administradores
          </p>
        </div>
        <button
          onClick={limparLogs}
          className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-red-200 dark:border-red-500/20 self-start md:self-auto"
        >
          Limpar logs
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
          {LOG_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filtro === t
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                  : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-slate-400"
              }`}
            >
              {LOG_TYPE_CONFIG[t]?.label || "Todos"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            type="text"
            placeholder="Buscar por ação ou usuário..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-6xl mb-4 block">receipt_long</span>
            <p className="text-slate-400 font-medium">Nenhum log registrado ainda.</p>
            <p className="text-xs text-slate-400 mt-1">As ações do sistema aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtrados.map(log => {
              const cfg = LOG_TYPE_CONFIG[log.tipo] || LOG_TYPE_CONFIG.sistema;
              return (
                <div key={log.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                  <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <span className={`material-symbols-outlined text-lg ${cfg.text}`}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{log.descricao}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[10px] mr-1">person</span>
                        {log.usuario}
                      </span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">{getTimeAgo(log.timestamp)}</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtrados.length > 0 && (
        <p className="text-xs text-slate-400 font-medium text-center">
          Exibindo {filtrados.length} de {logs.length} registros
        </p>
      )}
    </div>
  );
}
