import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseJwtPayload } from "../utils/jwt-utils";
import { usuarioApi } from "../services/api";
import { toast } from "react-toastify";

const navItems = [
  { to: "/admin", icon: "dashboard", label: "Dashboard", permission: ["USER", "ADMIN", "GESTAO_QUARTOS", "GESTAO_RESERVAS"] },
  { to: "/admin/quartos", icon: "bed", label: "Gestão de Quartos", permission: ["ADMIN", "GESTAO_QUARTOS"] },
  { to: "/admin/reservas", icon: "calendar_month", label: "Reservas", permission: ["ADMIN", "GESTAO_RESERVAS"] },
  { to: "/admin/usuarios", icon: "badge", label: "Gestão Staff", permission: ["ADMIN"] },
  { to: "/admin/clientes", icon: "group", label: "Base de Clientes", permission: ["ADMIN", "GESTAO_RESERVAS"] },
  { to: "/admin/notificacoes", icon: "notifications", label: "Notificacoes", permission: ["USER", "ADMIN", "GESTAO_QUARTOS", "GESTAO_RESERVAS"] },
  { to: "/admin/logs", icon: "terminal", label: "Logs do Sistema", permission: ["ADMIN"] },
];

export default function Layout() {
  const { user, logout, refreshUser } = useAuth();
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
    const agora = new Date();
    const initial = [
      { id: 1, text: "Nova reserva realizada no quarto 102", timestamp: new Date(agora.getTime() - 5 * 60 * 1000), type: "reserva" },
      { id: 2, text: "Check-out pendente para amanhã", timestamp: new Date(agora.getTime() - 2 * 60 * 60 * 1000), type: "alerta" },
    ];
    localStorage.setItem("grandhotel_notifications", JSON.stringify(initial));
    return initial;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: "", email: "" });
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
      setProfileForm({ nome: user.nome || "", email: user.email || "" });
      setShowPasswordSection(false);
      setPasswordForm({ senhaAntiga: "", novaSenha: "" });
    }
  }, [showProfileModal, user]);



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
          email: user.email,
          dataNascimento: user.dataNascimento,
          cargos: normalizedCargos,
          senha: "" // Senha vazia para não alterar
        });

        // Atualiza o "user" do contexto imediatamente para refletir a nova foto no topo.
        await refreshUser();

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

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffH < 24) return `Há ${diffH} hora${diffH > 1 ? "s" : ""}`;
    if (diffD === 1) return "Ontem";
    return `Há ${diffD} dias`;
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
        border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-50 transition-[width,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarCollapsed ? "lg:w-22" : "lg:w-64"}
      `}>
        {/* Toggle Button integrado à borda lateral */}
        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full size-6 hidden lg:flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-md z-[60] text-slate-400 hover:text-primary active:scale-95"
          title={sidebarCollapsed ? "Expandir" : "Recolher"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {sidebarCollapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

        {/* Logo / Brand Area */}
        <div className={`p-6 flex items-center gap-3 transition-all duration-500 overflow-hidden ${sidebarCollapsed ? "justify-center px-0" : "justify-between"}`}>
          <div className="size-11 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 flex-shrink-0">
             <span className="material-symbols-outlined text-2xl">apartment</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-sm font-black leading-tight whitespace-nowrap">Grand Hotel</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">Console Admin</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className={`flex-1 space-y-3 transition-all duration-500 overflow-y-auto overflow-x-hidden pt-2 ${sidebarCollapsed ? "px-2" : "px-4"}`}>
          {filteredNavItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center transition-all duration-300 rounded-2xl ${
                  sidebarCollapsed 
                    ? "justify-center size-14 mx-auto" 
                    : "gap-3 px-4 py-3.5 mx-0"
                } ${
                  isActive
                    ? "bg-primary text-slate-900 font-black shadow-xl shadow-primary/30"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <div className={`flex items-center gap-3 z-10 ${sidebarCollapsed ? "justify-center" : ""}`}>
                <span className={`material-symbols-outlined transition-transform duration-300 group-hover:scale-110 ${sidebarCollapsed ? "text-2xl" : "text-xl"}`}>
                  {icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                    {label}
                  </span>
                )}
              </div>
              
              {/* Active Indicator Arrow */}
              {!sidebarCollapsed && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none overflow-hidden">
                  <div className={`
                    transition-all duration-500 ease-out transform
                    group-[.active]:translate-x-0 group-[.active]:opacity-100
                    group-[:not(.active)]:translate-x-8 group-[:not(.active)]:opacity-0
                  `}>
                    <span className="material-symbols-outlined text-sm font-black text-slate-900/40">arrow_forward</span>
                  </div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom / Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          {sidebarCollapsed ? (
            <button 
              onClick={handleLogout}
              className="size-14 mx-auto flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
              title="Sair do sistema"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/footer">
              <div className="size-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center font-black text-xs shadow-sm shadow-primary/20 overflow-hidden flex-shrink-0 transition-transform group-hover/footer:scale-105">
                {getInitials(user?.nome)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate text-slate-900 dark:text-white">{user?.nome || "Usuário"}</p>
                <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-tighter">{user?.cargos?.[0] || ""}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="size-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                title="Sair"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>


      <main className={`flex-1 min-h-screen w-full overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? "lg:pl-22" : "lg:pl-64"}`}>
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
              <div className="flex items-center gap-4">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Ver Site Público
                </Link>
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
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="size-8 rounded-full bg-primary flex items-center justify-center text-slate-900 font-bold text-[10px] overflow-hidden">
                  {getInitials(user?.nome)}
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
                              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{getTimeAgo(n.timestamp)}</p>
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
        <div className="p-6 lg:p-12 w-full flex justify-center">
          <div className="w-full max-w-[1700px]">
            <Outlet />
          </div>
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
                <div className="size-32 rounded-3xl border-8 border-white dark:border-slate-900 bg-primary text-slate-900 mx-auto flex items-center justify-center shadow-2xl overflow-hidden mb-6 transition-transform group-hover:scale-[1.02] text-4xl font-black">
                   {getInitials(user?.nome)}
                </div>
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

