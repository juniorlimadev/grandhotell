import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quartoApi, reservaApi } from "../services/api";
import { toast } from "react-toastify";
import { formatDate } from "../utils/date-utils";

/**
 * Componente Dashboard
 * Apresenta uma visão geral do sistema, incluindo estatísticas de ocupação,
 * receita estimada e atalhos para as principais funcionalidades.
 */
export default function Dashboard() {
  const [quartos, setQuartos] = useState({ content: [], totalElements: 0 });
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca dados iniciais para o painel
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Busca quartos (para contagem total) e reservas do mês atual simultaneamente
        const [qRes, rRes] = await Promise.all([
          quartoApi.list(0, 50),
          reservaApi.quartosOcupados(new Date(), new Date(Date.now() + 30 * 24 * 3600 * 1000)),
        ]);
        if (!cancelled) {
          setQuartos(qRes.data);
          setReservas(Array.isArray(rRes.data) ? rRes.data : []);
        }
      } catch {
        if (!cancelled) {
          setQuartos({ content: [], totalElements: 0 });
          toast.error("Erro ao carregar dados do painel.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Lógica de Negócio para o Painel
  const totalQuartos = quartos.totalElements ?? quartos.content?.length ?? 0;
  const ocupados = reservas.length;
  const taxaOcupacao = totalQuartos > 0 ? Math.round((ocupados / totalQuartos) * 100) : 0;

  // Indexa quartos por id uma vez para evitar buscas O(n²) ao calcular receita
  const diariaPorQuarto = useMemo(() => {
    const mapa = new Map();
    (quartos.content || []).forEach((q) => {
      mapa.set(q.idQuarto, q.valorDiaria || 0);
    });
    return mapa;
  }, [quartos]);

  /**
   * Cálculo de receita estimada baseado nos quartos ocupados e duração das reservas.
   * Usa o mapa de diárias para garantir custo O(n) mesmo com muitas reservas/quartos.
   */
  const receitaEstimada = useMemo(
    () =>
      reservas.reduce((acc, r) => {
        const diaria = diariaPorQuarto.get(r.idQuarto) ?? 0;
        if (!diaria) return acc;

        const d1 = new Date(
          r.dtInicio.includes("-") ? r.dtInicio.split("-").reverse().join("-") : r.dtInicio
        );
        const d2 = new Date(
          r.dtFim.includes("-") ? r.dtFim.split("-").reverse().join("-") : r.dtFim
        );
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        return acc + diaria * diffDays;
      }, 0),
    [reservas, diariaPorQuarto]
  );


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Visão Geral do Painel</h2>
          <p className="text-slate-500 dark:text-slate-400">Status operacional em tempo real da propriedade</p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/admin/reservas"
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">event_note</span>
            Gerenciar Reservas
          </Link>
          <Link
            to="/admin/quartos/novo"
            className="flex items-center gap-3 px-6 py-3 bg-primary text-slate-900 rounded-xl text-sm font-black hover:brightness-95 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg font-black">add</span>
            Novo Quarto
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">meeting_room</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total de Quartos</p>
          <p className="text-3xl font-black mt-1">{loading ? "..." : totalQuartos}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <span className="material-symbols-outlined text-blue-500">person_check</span>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Hoje</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Taxa de Ocupação</p>
          <p className="text-3xl font-black mt-1">{loading ? "..." : `${taxaOcupacao}%`}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <span className="material-symbols-outlined text-orange-500">pending_actions</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Reservas Ativas</p>
          <p className="text-3xl font-black mt-1">{loading ? "..." : reservas.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <span className="material-symbols-outlined text-emerald-500">payments</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receita Estimada</p>
          <p className="text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
            {loading ? "..." : (receitaEstimada || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Inventário de Quartos</h3>
            <Link to="/admin/quartos" className="text-sm text-primary font-bold hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Quarto</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ala</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Valor diária</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      Carregando...
                    </td>
                  </tr>
                ) : (
                  (quartos.content || []).map((q) => (
                    <tr key={q.idQuarto} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold">{q.nome}</td>
                      <td className="px-6 py-4 text-sm">{q.alaHotel || "—"}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                        {q.valorDiaria ? q.valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/admin/quartos/${q.idQuarto}`} className="text-primary hover:underline text-sm font-bold">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
                Mostrando {(quartos.content || []).length} de {quartos.totalElements ?? 0} quartos
              </span>
              <Link to="/admin/quartos" className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                Ver todos
              </Link>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Reservas Ativas</h3>
            <Link to="/admin/reservas" className="text-sm text-primary font-bold hover:underline">
              Ver Tudo
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : reservas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma reserva no período.</p>
            ) : (
              reservas.slice(0, 5).map((r) => (
                <div
                  key={r.idReserva}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-start gap-3"
                >
                  <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-sm">
                    {r.idReserva}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold">Reserva #{r.idReserva}</h4>
                    <p className="text-xs text-slate-500">
                      Quarto {r.idQuarto ?? "—"} • {r.dtInicio && r.dtFim ? `${formatDate(r.dtInicio)} - ${formatDate(r.dtFim)}` : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
