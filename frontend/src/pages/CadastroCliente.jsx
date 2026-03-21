import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usuarioApi } from "../services/api";
import { toast } from "react-toastify";

export default function CadastroCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    dataNascimento: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usuarioApi.create(form);
      toast.success("Conta criada com sucesso! Agora você já pode fazer login.");
      navigate("/login-cliente");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao criar conta. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="text-2xl font-black text-[#006972] mb-4">GrandHotel</div>
          <h1 className="text-3xl font-black text-[#131b30] tracking-tight">Criar sua Conta</h1>
          <p className="text-slate-500 font-medium mt-2">Junte-se ao nosso clube de exclusividade.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
            <input 
              required
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
              placeholder="Como deseja ser chamado?"
              value={form.nome}
              onChange={e => setForm({...form, nome: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
            <input 
              required
              type="email"
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
              placeholder="exemplo@email.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 gap-5">
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data de Nascimento</label>
                <input 
                  required
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold text-slate-500"
                  value={form.dataNascimento}
                  onChange={e => setForm({...form, dataNascimento: e.target.value})}
                />
             </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
            <input 
              required
              type="password"
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
              placeholder="Sua senha secreta"
              value={form.senha}
              onChange={e => setForm({...form, senha: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#006972] text-white py-5 rounded-[2rem] font-black text-base shadow-xl shadow-[#006972]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Criando..." : "Confirmar Cadastro"}
          </button>

        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-bold text-slate-400">
            Já tem uma conta?{" "}
            <Link to="/login-cliente" className="text-[#006972] hover:underline">Fazer Login</Link>
          </p>
          <Link to="/" className="inline-block mt-4 text-[10px] font-black uppercase text-slate-300 hover:text-[#006972] transition-colors tracking-widest">
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
