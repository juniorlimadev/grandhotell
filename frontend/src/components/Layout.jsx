import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/quartos", icon: "bed", label: "Gestão de Quartos" },
  { to: "/reservas", icon: "calendar_month", label: "Reservas" },
  { to: "/usuarios", icon: "group", label: "Gestão de Usuários" },
  { to: "/notificacoes", icon: "notifications", label: "Notificações" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nova reserva realizada no quarto 102", time: "Há 5 min", type: "reserva" },
    { id: 2, text: "Check-out pendente para amanhã", time: "Há 2 horas", type: "alerta" },
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ nome: "", email: "", fotoUrl: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (showProfileModal && user) {
      setProfileForm({ nome: user.nome || "", email: user.email || "", fotoUrl: user.fotoUrl || "" });
    }
  }, [showProfileModal, user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Usando idUsuario extraído do token ou passado via context
      // Como o context só tem nome/email, precisamos do ID ou email para buscar.
      // Vou assumir que o usuarioApi.update aceita o ID que está no token.
      const payload = parseJwtPayload(localStorage.getItem("token"));
      if (payload?.id) {
        await usuarioApi.update(payload.id, {
          ...user,
          nome: profileForm.nome,
          fotoUrl: profileForm.fotoUrl
        });
        toast.success("Perfil atualizado! Faça login novamente para ver todas as mudanças.");
        setShowProfileModal(false);
      }
    } catch (e) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Iniciais do nome para o Avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-900">apartment</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Grand Hotel</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Console Administrativo</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-slate-900 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2 group">
            <div className="size-9 rounded-full bg-primary text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm">
              {getInitials(user?.nome)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate">{user?.nome || "Usuário"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
              title="Sair"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 lg:ml-64 min-h-screen w-full overflow-x-hidden">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-48 xl:w-80 focus:ring-2 focus:ring-primary"
                  placeholder="Pesquisar..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* User display moved here */}
              <div className="p-1 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-slate-900 font-bold text-sm overflow-hidden flex-shrink-0">
                  {user?.fotoUrl ? (
                    <img src={user.fotoUrl} alt={user.nome} className="size-full object-cover" />
                  ) : (
                    getInitials(user?.nome)
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Bem-vindo</p>
                  <p className="text-xs font-bold leading-none">{user?.nome || "Usuário"}</p>
                </div>
              </div>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowSettings(false);
                  }}
                  className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-primary' : ''}`}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h4 className="font-bold text-sm">Notificações</h4>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">notifications_off</span>
                          <p className="text-xs text-slate-500">Sem novas notificações</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 text-left">
                            <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'reserva' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                              <span className="material-symbols-outlined text-lg">{n.type === 'reserva' ? 'check_circle' : 'info'}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold leading-tight">{n.text}</p>
                              <p className="text-[10px] text-primary mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link 
                      to="/notificacoes"
                      onClick={() => setShowNotifications(false)}
                      className="block w-full py-3 text-center text-xs text-slate-500 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800"
                    >
                      Ver todas as notificações
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
                  className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors ${showSettings ? 'bg-slate-100 dark:bg-slate-800 text-primary' : ''}`}
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2">
                    <button 
                      onClick={() => {
                        setShowSettings(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-lg">account_circle</span>
                      <span>Minha Conta</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="h-24 bg-primary relative">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 size-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                title="Fechar"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="px-6 pb-8 text-center -mt-12">
              <div className="size-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center shadow-lg overflow-hidden mb-4">
                {user?.fotoUrl ? (
                  <img src={user.fotoUrl} alt={user.nome} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-primary flex items-center justify-center text-slate-900 text-3xl font-black">
                    {getInitials(user?.nome)}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                  <input 
                    type="text"
                    value={profileForm.nome}
                    onChange={(e) => setProfileForm({...profileForm, nome: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail (Login)</label>
                  <input 
                    type="text"
                    value={profileForm.email}
                    disabled
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">URL da Foto</label>
                  <input 
                    type="text"
                    value={profileForm.fotoUrl}
                    onChange={(e) => setProfileForm({...profileForm, fotoUrl: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 py-3 bg-primary text-slate-900 rounded-xl text-xs font-bold hover:brightness-95 transition-all disabled:opacity-50"
                  >
                    {savingProfile ? "Salvando..." : "Salvar Mudanças"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
