import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  "CONFIRMADA": { label: "Ocupado",    dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  "PENDENTE":   { label: "Pendente",   dot: "bg-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
  "CANCELADA":  { label: "Cancelado",  dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-500/10",     text: "text-red-600 dark:text-red-400" },
  "CONCLUIDA":  { label: "Concluída",  dot: "bg-slate-400",   bg: "bg-slate-50 dark:bg-slate-800",    text: "text-slate-500" },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const [quartos, setQuartos] = useState([]);
  const [totalQuartos, setTotalQuartos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [reservas, setReservas] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const hoje = new Date();
        const fim30 = new Date(hoje.getTime() + 30 * 24 * 3600 * 1000);

        const [qRes, rRes] = await Promise.all([
          quartoApi.list(page, 5, "idQuarto", "DESC"),
          reservaApi.quartosOcupados(hoje, fim30),
        ]);

        setQuartos(qRes.data.content || []);
        setTotalQuartos(qRes.data.totalElements || 0);
        setTotalPages(qRes.data.totalPages || 1);
        setReservas(Array.isArray(rRes.data) ? rRes.data : []);
      } catch {
        toast.error("Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  // Calcula faturamento estimado do dia (reservas ativas * diária)
  const receitaHoje = useMemo(() => {
    return reservas.reduce((acc, r) => acc + (r.valorDiaria || 0), 0);
  }, [reservas]);

  const taxaOcupacao = totalQuartos > 0
    ? Math.min(100, Math.round((reservas.length / totalQuartos) * 100))
    : 0;

  // Filtra reservas por status no painel lateral
  const reservasFiltradas = filtroStatus === "Todos"
    ? reservas
    : reservas.filter(r => r.status === filtroStatus);

  // Determina status visual de um quarto pelo cruzamento com reservas ativas
  const statusDoQuarto = (idQuarto) => {
    const tem = reservas.find(r => r.idQuarto === idQuarto);
    if (!tem) return { label: "Disponível", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" };
    const cfg = STATUS_CONFIG[tem.status] || STATUS_CONFIG["CONFIRMADA"];
    return cfg;
  };

  const cards = [
    { label: "Total de Quartos", val: totalQuartos, icon: "bed", color: "text-[#006972]", bg: "bg-[#006972]/10", badge: "+2.5%", badgeColor: "text-emerald-500" },
    { label: "Taxa de Ocupação", val: `${taxaOcupacao}%`, icon: "person_raised_hand", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", badge: "Hoje", badgeColor: "text-slate-400" },
    { label: "Reservas Ativas", val: reservas.length, icon: "event_note", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", badge: reservas.length > 0 ? `+${reservas.length}` : "0", badgeColor: reservas.length > 0 ? "text-orange-500" : "text-slate-400" },
    { label: "Receita Estimada", val: receitaHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: "payments", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", badge: "+8%", badgeColor: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className={`size-11 ${c.bg} rounded-xl flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span>
              </div>
              <span className={`text-xs font-bold ${c.badgeColor}`}>{c.badge}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">{c.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading ? "—" : c.val}
            </p>
          </div>
        ))}
      </div>

      {/* Inventário + Reservas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Inventário de Quartos */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Inventário de Quartos</h3>
            <div className="flex gap-1">
              {["Todos", "Disponível", "Ocupado"].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroStatus(f === "Disponível" ? "Todos" : f === "Ocupado" ? "CONFIRMADA" : "Todos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    (f === "Todos" && filtroStatus === "Todos") ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" :
                    ((f === "Ocupado" && filtroStatus === "CONFIRMADA")) ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" :
                    "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800">
                  <th className="px-6 py-3">Quarto</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Andar</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : quartos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                      Nenhum quarto cadastrado.{" "}
                      <Link to="/admin/quartos/novo" className="text-[#006972] font-bold hover:underline">Cadastrar agora</Link>
                    </td>
                  </tr>
                ) : (
                  quartos.map(q => {
                    const st = statusDoQuarto(q.idQuarto);
                    return (
                      <tr key={q.idQuarto} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900 dark:text-white">{q.nome}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{q.tipo || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{q.alaHotel || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}>
                            <span className={`size-1.5 rounded-full ${st.dot}`}></span>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/admin/quartos/${q.idQuarto}`} className="text-[#006972] hover:underline text-xs font-bold">Editar</Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {quartos.length} de {totalQuartos} quartos
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>

        {/* Reservas Ativas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Reservas Ativas</h3>
            <Link to="/admin/reservas" className="text-xs font-black text-[#006972] hover:underline">Ver Tudo</Link>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[440px] overflow-y-auto">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-3 animate-pulse">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : reservas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-4xl mb-2 block">event_busy</span>
                <p className="text-slate-400 text-sm font-medium">Sem reservas ativas</p>
              </div>
            ) : (
              reservas.slice(0, 8).map((r, i) => {
                const formatDate = (d) => {
                  if (!d) return "";
                  try {
                    const parts = typeof d === "string" && d.includes("-")
                      ? (d.split("T")[0].split("-").length === 3 && d.split("T")[0].split("-")[0].length === 4
                          ? d.split("T")[0]
                          : d.split("-").reverse().join("-"))
                      : d;
                    return new Date(parts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                  } catch { return ""; }
                };

                const st = STATUS_CONFIG[r.status] || STATUS_CONFIG["CONFIRMADA"];
                const nomeHospede = r.hospedeNome || r.nomeHospede || "Hóspede";
                const isCheckout = r.status === "PENDENTE";
                const isNovo = i === 0;

                return (
                  <div key={r.idReserva || i} className="px-6 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {getInitials(nomeHospede)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{nomeHospede}</p>
                        {isNovo && <span className="text-[10px] font-black text-[#006972] bg-[#006972]/10 px-2 py-0.5 rounded-full flex-shrink-0">NOVO</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        Quarto {r.idQuarto} {r.dtInicio && r.dtFim ? `• ${formatDate(r.dtInicio)} – ${formatDate(r.dtFim)}` : ""}
                      </p>
                      {isCheckout && (
                        <p className="text-[11px] font-black text-orange-500 mt-0.5">Ação Necessária</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
