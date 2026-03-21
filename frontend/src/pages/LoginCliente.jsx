import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
export default function LoginCliente() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    senha: ""
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.senha);
      toast.success("Bem-vindo(a) ao GrandHotel!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro no login. Verifique seu e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center lg:justify-end overflow-hidden font-['Plus_Jakarta_Sans'] bg-[#131b30]">
      {/* Background Image with better visibility and fallback */}
      <div className="absolute inset-0 z-0 h-full w-full">
         <img 
            className="w-full h-full object-cover transition-opacity duration-1000 opacity-60 lg:opacity-100" 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Luxury Hotel"
            onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2070&q=80";
            }}
         />
         <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#131b30]/60 via-[#131b30]/40 to-[#131b30]/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl p-8 md:p-12 lg:p-20 bg-white/10 lg:bg-white/5 backdrop-blur-xl lg:backdrop-blur-3xl lg:h-screen flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/20 shadow-2xl m-4 lg:m-0 rounded-[2.5rem] lg:rounded-none">
        <div className="mb-10 lg:mb-12">
          <Link to="/" className="inline-block text-2xl font-black text-[#8edce6] mb-8 hover:scale-105 transition-transform">GrandHotel</Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
            Acesse seu <br />
            <span className="text-[#8edce6]">Refúgio Particular</span>
          </h1>
          <p className="text-slate-300 font-medium text-sm lg:text-base">Bem-vindo de volta! Entre para gerenciar sua experiência de luxo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          <div>
            <label className="block text-[10px] font-black text-[#8edce6] uppercase tracking-[0.2em] mb-3 ml-1">E-mail de Acesso</label>
            <input 
              required
              type="email"
              className="w-full px-6 lg:px-8 py-4 lg:py-5 bg-white/10 border border-white/10 rounded-2xl lg:rounded-3xl focus:ring-2 focus:ring-[#8edce6] transition-all font-bold text-white placeholder:text-slate-500 text-sm lg:text-base outline-none"
              placeholder="seu@contato.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#8edce6] uppercase tracking-[0.2em] mb-3 ml-1">Sua Senha</label>
            <input 
              required
              type="password"
              className="w-full px-6 lg:px-8 py-4 lg:py-5 bg-white/10 border border-white/10 rounded-2xl lg:rounded-3xl focus:ring-2 focus:ring-[#8edce6] transition-all font-bold text-white placeholder:text-slate-500 text-sm lg:text-base outline-none"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setForm({...form, senha: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#8edce6] text-[#004f56] py-5 lg:py-6 rounded-2xl lg:rounded-[2.5rem] font-black text-sm lg:text-base shadow-2xl shadow-[#8edce6]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Sincronizando..." : "Entrar em Minha Conta"}
          </button>

          <div className="flex justify-between items-center px-1">
             <Link to="/esqueci-senha" title="Recuperar acesso" className="text-xs font-black uppercase text-[#8edce6]/60 hover:text-[#8edce6] transition-colors tracking-widest">
                Esqueci minha senha
             </Link>
          </div>
        </form>

        <div className="mt-10 lg:mt-12 text-center lg:text-left">
          <p className="text-sm font-bold text-slate-400">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-[#8edce6] hover:underline">Sua jornada começa aqui</Link>
          </p>
          <div className="mt-12 lg:mt-20 flex flex-wrap justify-center lg:justify-start gap-8 items-center">
             <Link to="/" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Início</Link>
             <Link to="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Acesso Staff</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

