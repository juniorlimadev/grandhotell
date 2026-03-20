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
    <div className="min-h-screen relative flex items-center justify-end overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
         <img 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1571896349842-337edd2eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Luxury Hotel"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-[#131b30]/10 via-[#131b30]/40 to-[#131b30]/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl p-8 md:p-20 bg-white/10 backdrop-blur-2xl h-screen flex flex-col justify-center border-l border-white/20">
        <div className="mb-12">
          <div className="text-2xl font-black text-[#8edce6] mb-8">GrandHotel</div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
            Acesse seu <br />
            <span className="text-[#8edce6]">Refúgio Particular</span>
          </h1>
          <p className="text-slate-200 font-medium">Faça login para gerenciar suas reservas e personalizar sua estadia.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-1">E-mail de Acesso</label>
            <input 
              required
              type="email"
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl focus:ring-2 focus:ring-[#8edce6] transition-all font-bold text-white placeholder:text-slate-500"
              placeholder="seu@contato.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-1">Sua Senha</label>
            <input 
              required
              type="password"
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl focus:ring-2 focus:ring-[#8edce6] transition-all font-bold text-white placeholder:text-slate-500"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setForm({...form, senha: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#8edce6] text-[#004f56] py-6 rounded-[2.5rem] font-black text-base shadow-2xl shadow-[#8edce6]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Sincronizando..." : "Entrar em Minha Conta"}
          </button>
        </form>

        <div className="mt-12 text-center md:text-left">
          <p className="text-sm font-bold text-slate-400">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-[#8edce6] hover:underline">Sua jornada começa aqui</Link>
          </p>
          <div className="mt-20 flex gap-8 items-center">
             <Link to="/" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Início</Link>
             <Link to="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Área Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
