import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success("E-mail de recuperação enviado!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao solicitar recuperação. Verifique o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <div className="size-16 bg-[#006972]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[#006972] text-3xl">lock_reset</span>
          </div>
          <h1 className="text-3xl font-black text-[#131b30] tracking-tight">Recuperar Senha</h1>
          <p className="text-slate-500 font-medium mt-2">Enviaremos um link de acesso para o seu e-mail.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Seu E-mail Cadastrado</label>
              <input 
                required
                type="email"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold outline-none"
                placeholder="exemplo@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#006972] text-white py-5 rounded-[2rem] font-black text-base shadow-xl shadow-[#006972]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 bg-emerald-50 rounded-3xl border border-emerald-100">
             <span className="material-symbols-outlined text-emerald-500 text-4xl mb-4">check_circle</span>
             <p className="text-emerald-900 font-bold mb-2">E-mail enviado com sucesso!</p>
             <p className="text-emerald-700 text-sm font-medium">Verifique sua caixa de entrada e siga as instruções.</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/login-cliente" className="text-sm font-bold text-[#006972] hover:underline flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
