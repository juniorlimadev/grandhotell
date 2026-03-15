import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email, senha);
      navigate("/", { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || "E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-900 text-2xl">apartment</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Grand Hotel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Console Administrativo</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Entrar</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Use seu e-mail e senha para acessar o painel.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>
            {erro && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{erro}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
