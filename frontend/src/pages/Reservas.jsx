import { useState, useEffect } from "react";
import { reservaApi, quartoApi, usuarioApi } from "../services/api";

function toInputDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function formatDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [quartosLivres, setQuartosLivres] = useState({ content: [] });
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({
    idUsuario: "",
    idQuarto: "",
    dtInicio: toInputDate(new Date()),
    dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [dtInicio, setDtInicio] = useState(toInputDate(new Date()));
  const [dtFim, setDtFim] = useState(toInputDate(new Date(Date.now() + 30 * 24 * 3600 * 1000)));

  const carregarReservas = async () => {
    try {
      const res = await reservaApi.quartosOcupados(dtInicio, dtFim);
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReservas([]);
    }
  };

  const carregarQuartosLivres = async () => {
    try {
      const res = await reservaApi.quartosLivres(0, 50, dtInicio, dtFim);
      setQuartosLivres(res.data);
    } catch {
      setQuartosLivres({ content: [] });
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [rRes, uRes] = await Promise.all([
          reservaApi.quartosOcupados(dtInicio, dtFim),
          usuarioApi.list(0, 100),
        ]);
        if (!cancelled) {
          setReservas(Array.isArray(rRes.data) ? rRes.data : []);
          setUsuarios(uRes.data?.content || []);
        }
      } catch {
        if (!cancelled) setReservas([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dtInicio, dtFim]);

  useEffect(() => {
    if (modalAberto) {
      reservaApi.quartosLivres(0, 100, form.dtInicio, form.dtFim).then((res) => setQuartosLivres(res.data)).catch(() => {});
    }
  }, [modalAberto, form.dtInicio, form.dtFim]);

  const abrirNovo = () => {
    setForm({
      idUsuario: usuarios[0]?.idUsuario ?? "",
      idQuarto: "",
      dtInicio: toInputDate(new Date()),
      dtFim: toInputDate(new Date(Date.now() + 24 * 3600 * 1000)),
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await reservaApi.create({
        idUsuario: Number(form.idUsuario),
        idQuarto: Number(form.idQuarto),
        dtInicio: form.dtInicio,
        dtFim: form.dtFim,
      });
      setModalAberto(false);
      carregarReservas();
    } catch (e) {
      setErro(e.response?.data?.message || "Erro ao criar reserva.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (idReserva) => {
    if (!window.confirm("Cancelar esta reserva?")) return;
    try {
      await reservaApi.delete(idReserva);
      carregarReservas();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Reservas</h2>
          <p className="text-slate-500 dark:text-slate-400">Consultar e criar reservas</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Reserva
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data início</label>
          <input
            type="date"
            value={dtInicio}
            onChange={(e) => setDtInicio(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data fim</label>
          <input
            type="date"
            value={dtFim}
            onChange={(e) => setDtFim(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Quarto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Período</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando...</td>
              </tr>
            ) : reservas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma reserva no período.</td>
              </tr>
            ) : (
              reservas.map((r) => (
                <tr key={r.idReserva} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-bold">{r.idReserva}</td>
                  <td className="px-6 py-4">{r.quarto?.nome ?? r.idQuarto ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(r.dtInicio)} - {formatDate(r.dtFim)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <span className="size-1.5 rounded-full bg-blue-500" />
                      {r.statusQuarto ?? "Ocupado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.idReserva)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nova reserva</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hóspede (usuário)</label>
                <select
                  value={form.idUsuario}
                  onChange={(e) => setForm((f) => ({ ...f, idUsuario: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecione</option>
                  {usuarios.map((u) => (
                    <option key={u.idUsuario} value={u.idUsuario}>{u.nome} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data entrada</label>
                <input
                  type="date"
                  value={form.dtInicio}
                  onChange={(e) => setForm((f) => ({ ...f, dtInicio: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data saída</label>
                <input
                  type="date"
                  value={form.dtFim}
                  onChange={(e) => setForm((f) => ({ ...f, dtFim: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quarto (livres no período)</label>
                <select
                  value={form.idQuarto}
                  onChange={(e) => setForm((f) => ({ ...f, idQuarto: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecione</option>
                  {(quartosLivres.content || []).map((q) => (
                    <option key={q.idQuarto} value={q.idQuarto}>{q.nome} - {q.alaHotel}</option>
                  ))}
                </select>
              </div>
              {erro && <p className="text-sm text-red-500">{erro}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-95 disabled:opacity-70">
                  {salvando ? "Salvando..." : "Criar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
