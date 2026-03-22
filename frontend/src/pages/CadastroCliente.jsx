import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clienteApi } from "../services/api";
import { toast } from "react-toastify";

export default function CadastroCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    dataNascimento: "",
    documento: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
    profissao: "",
    placaVeiculo: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clienteApi.create(form);
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
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="size-10 bg-[#006972] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#006972]/20">
                <span className="material-symbols-outlined text-2xl">apartment</span>
             </div>
             <div className="text-2xl font-black text-[#006972]">GrandHotel</div>
          </div>
          <h1 className="text-3xl font-black text-[#131b30] tracking-tight">Criar sua Conta</h1>
          <p className="text-slate-500 font-medium mt-2">Junte-se ao nosso clube de exclusividade.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CPF / Passaporte</label>
              <input 
                required
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
                placeholder="Apenas números ou Passaporte"
                value={form.documento}
                onChange={e => setForm({...form, documento: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone / Celular</label>
              <input 
                required
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={e => setForm({...form, telefone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          </div>

          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Endereço Completo</label>
             <input 
               required
               className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold"
               placeholder="Rua, Número, Bairro"
               value={form.endereco}
               onChange={e => setForm({...form, endereco: e.target.value})}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cidade</label>
               <input required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado</label>
               <input required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">País</label>
               <input required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" value={form.pais} onChange={e => setForm({...form, pais: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profissão (Opcional)</label>
               <input className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" value={form.profissao} onChange={e => setForm({...form, profissao: e.target.value})} />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Placa do Veículo (Opcional)</label>
               <input className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006972] transition-all font-bold" value={form.placaVeiculo} onChange={e => setForm({...form, placaVeiculo: e.target.value})} />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#006972] text-white py-5 rounded-[2rem] font-black text-base shadow-xl shadow-[#006972]/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Criando..." : "Finalizar Cadastro"}
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
