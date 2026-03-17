import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseJwtPayload } from "../utils/jwt-utils";
import { usuarioApi } from "../services/api";
import { toast } from "react-toastify";

const navItems = [
  { to: "/", icon: "dashboard", label: "Dashboard", permission: ["USER", "ADMIN", "GESTAO_QUARTOS", "GESTAO_RESERVAS"] },
  { to: "/quartos", icon: "bed", label: "Gestão de Quartos", permission: ["ADMIN", "GESTAO_QUARTOS"] },
  { to: "/reservas", icon: "calendar_month", label: "Reservas", permission: ["ADMIN", "GESTAO_RESERVAS"] },
  { to: "/usuarios", icon: "group", label: "Gestão de Usuários", permission: ["ADMIN"] },
  { to: "/notificacoes", icon: "notifications", label: "Notificações", permission: ["USER", "ADMIN", "GESTAO_QUARTOS", "GESTAO_RESERVAS"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Filtra itens de navegação baseado nas permissões do usuário
  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    return item.permission.some(p => user?.cargos?.includes(p));
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("grandhotel_notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((n) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
      } catch {
        // se der erro, volta para o estado padrão
      }
    }
    const initial = [
      { id: 1, text: "Nova reserva realizada no quarto 102", time: "Há 5 min", type: "reserva" },
      { id: 2, text: "Check-out pendente para amanhã", time: "Há 2 horas", type: "alerta" },
    ];
    localStorage.setItem("grandhotel_notifications", JSON.stringify(initial));
    return initial;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: "", email: "", fotoUrl: "" });
  const [passwordForm, setPasswordForm] = useState({ senhaAntiga: "", novaSenha: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "grandhotel_notifications",
      JSON.stringify(
        notifications.map((n) => ({
          ...n,
          timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp,
        }))
      )
    );
  }, [notifications]);

  useEffect(() => {
    if (showProfileModal && user) {
      setProfileForm({ nome: user.nome || "", email: user.email || "", fotoUrl: user.fotoUrl || "" });
      setShowPasswordSection(false);
      setPasswordForm({ senhaAntiga: "", novaSenha: "" });
    }
  }, [showProfileModal, user]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, fotoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = parseJwtPayload(localStorage.getItem("token"));
      if (payload?.id) {
        // Garante que os cargos enviados para o backend sejam sempre strings válidas
        const normalizedCargos = Array.isArray(user.cargos)
          ? user.cargos
              .map((c) =>
                typeof c === "string"
                  ? c
                  : c?.titulo || c?.nome || null
              )
              .filter(Boolean)
          : [];

        await usuarioApi.update(payload.id, {
          nome: profileForm.nome,
          fotoUrl: profileForm.fotoUrl,
          email: user.email,
          dataNascimento: user.dataNascimento,
          cargos: normalizedCargos,
          senha: "" // Senha vazia para não alterar
        });


        toast.success("Perfil atualizado! Faça login novamente para ver todas as mudanças.");
        setShowProfileModal(false);
      }
    } catch (err) {
      const mensagem = err?.response?.data?.message || "Erro ao atualizar perfil.";
      toast.error(mensagem);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.senhaAntiga || !passwordForm.novaSenha) {
      toast.warning("Preencha todos os campos da senha.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = parseJwtPayload(localStorage.getItem("token"));
      if (payload?.id) {
        await usuarioApi.mudarSenha(payload.id, passwordForm);
        toast.success("Senha alterada com sucesso!");
        setShowPasswordSection(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao alterar senha.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarCollapsed ? "lg:w-24" : "lg:w-64"}
      `}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-900">apartment</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-sm font-bold leading-tight">Grand Hotel</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Console Administrativo</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {filteredNavItems.map(({ to, icon, label }) => (

            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-slate-900 font-bold shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              {!sidebarCollapsed && <span className="text-sm">{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2">
            <div className="size-9 rounded-full bg-primary text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
              {user?.fotoUrl ? (
                <img src={user.fotoUrl} alt={user.nome} className="size-full object-cover" />
              ) : (
                getInitials(user?.nome)
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate">{user?.nome || "Usuário"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 min-h-screen w-full overflow-x-hidden lg:ml-64 ${sidebarCollapsed ? "lg:ml-24" : ""}`}>
        <header className="sticky top-0 z-[40] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden lg:inline-flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                <span className="material-symbols-outlined">
                  {sidebarCollapsed ? "chevron_right" : "chevron_left"}
                </span>
              </button>
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-48 xl:w-80 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Pesquisar..."
                />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="size-8 rounded-full bg-primary flex items-center justify-center text-slate-900 font-bold text-[10px] overflow-hidden">
                  {user?.fotoUrl ? (
                    <img src={user.fotoUrl} alt={user.nome} className="size-full object-cover" />
                  ) : (
                    getInitials(user?.nome)
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    {user?.cargos?.includes('ADMIN') ? 'Administrador' : 
                     user?.cargos?.includes('GESTAO_QUARTOS') ? 'Gestor de Quartos' :
                     user?.cargos?.includes('GESTAO_RESERVAS') ? 'Gestor de Reservas' : 
                     'Operador'}
                  </p>
                  <p className="text-xs font-bold leading-none">{user?.nome || "Usuário"}</p>
                </div>

              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowSettings(false);
                  }}
                  className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-all ${showNotifications ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : ''}`}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {notifications.length > 0 && !showNotifications && (
                    <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <h4 className="font-bold text-sm">Notificações</h4>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <span className="material-symbols-outlined text-slate-200 text-5xl mb-2">notifications_off</span>
                          <p className="text-xs text-slate-400 font-medium">Tudo em ordem por aqui!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                            <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'reserva' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                              <span className="material-symbols-outlined text-lg">{n.type === 'reserva' ? 'check_circle' : 'warning'}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.text}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{n.time === "Há 5 min" ? "Ontem" : n.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link 
                      to="/notificacoes"
                      onClick={() => setShowNotifications(false)}
                      className="block w-full py-3 text-center text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800"
                    >
                      Ver histórico completo
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setShowNotifications(false);
                  }}
                  className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all ${showSettings ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : ''}`}
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => {
                        setShowSettings(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-xl text-slate-400">account_circle</span>
                      <span>Meu Perfil</span>
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-xl">logout</span>
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden shadow-2xl my-auto">
            <div className="h-32 bg-primary relative">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 size-10 rounded-full bg-slate-900/10 text-slate-900 flex items-center justify-center hover:bg-slate-900/20 transition-all"
                title="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              {/* Added a subtle design element to the background as requested */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
            </div>
            
            <div className="px-6 pb-8 text-center -mt-16 relative z-10">
              <div className="relative inline-block group">
                <div className="size-32 rounded-3xl border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center shadow-2xl overflow-hidden mb-6 transition-transform group-hover:scale-[1.02]">
                  {profileForm.fotoUrl ? (
                    <img src={profileForm.fotoUrl} alt={user.nome} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-primary flex items-center justify-center text-slate-900 text-4xl font-black">
                      {getInitials(user?.nome)}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-6 right-0 size-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-slate-800 transition-all active:scale-90 border-4 border-white dark:border-slate-900">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              
              <div className="space-y-5 text-left">
                {!showPasswordSection ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome de Exibição</label>
                      <input 
                        type="text"
                        value={profileForm.nome}
                        onChange={(e) => setProfileForm({...profileForm, nome: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail Corporativo</label>
                      <input 
                        type="text"
                        value={profileForm.email}
                        disabled
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-none rounded-xl text-sm text-slate-400 font-medium cursor-not-allowed opacity-70"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-2">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="w-full py-4 bg-primary text-slate-900 rounded-2xl text-sm font-black hover:brightness-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                      >
                        {savingProfile ? "Salvando..." : "Salvar Alterações"}
                      </button>
                      <button 
                        onClick={() => setShowPasswordSection(true)}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                      >
                        Mudar Senha de Acesso
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPasswordSection(false)}>
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Voltar</span>
                    </div>
                    
                    <h4 className="text-lg font-black mb-4">Mudar Senha</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha Atual</label>
                        <input 
                          type="password"
                          value={passwordForm.senhaAntiga}
                          onChange={(e) => setPasswordForm({...passwordForm, senhaAntiga: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nova Senha</label>
                        <input 
                          type="password"
                          value={passwordForm.novaSenha}
                          onChange={(e) => setPasswordForm({...passwordForm, novaSenha: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      
                      <button 
                        onClick={handleChangePassword}
                        disabled={savingProfile}
                        className="w-full py-4 bg-primary text-slate-900 rounded-2xl text-sm font-black hover:brightness-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 mt-4"
                      >
                        {savingProfile ? "Processando..." : "Confirmar Nova Senha"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

