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

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const data = await login(email, senha);
      
      // Verifica se o usuário logado é um CLIENTE tentando acessar o painel administrativo
      const cargos = data.usuario?.cargos || []; 
      const eCliente = cargos.some(c => (typeof c === 'string' ? c : c.titulo) === "CLIENTE");

      if (eCliente) {
        logout();
        setErro("Acesso negado. Clientes devem utilizar a área de hóspedes.");
      } else {
        // Verifica se o usuário tem algum cargo de STAFF para acessar o painel administrativo
        const eStaff = cargos.some(c => ["ADMIN", "GESTAO_QUARTOS", "GESTAO_RESERVAS"].includes(typeof c === 'string' ? c : c.titulo));
        if (eStaff) {
          navigate("/admin", { replace: true });
        } else {
          logout(); // Se não é cliente e não é staff, não deveria estar aqui
          setErro("Acesso negado. Seu perfil não tem permissão para acessar o painel administrativo.");
        }
      }
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
          <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden p-2">
            <img src="/favicon.svg" alt="Grand Hotel" className="w-full h-full object-contain" />
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
