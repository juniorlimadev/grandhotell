import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/quartos", icon: "bed", label: "Gestão de Quartos" },
  { to: "/reservas", icon: "calendar_month", label: "Reservas" },
  { to: "/usuarios", icon: "group", label: "Gestão de Usuários" },
  { to: "/relatorios", icon: "analytics", label: "Análise de Receita" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="flex items-center gap-3 p-2">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs">person</span>
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
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="font-bold text-sm">Notificações</h4>
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">2 NOVAS</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                        <p className="text-xs font-bold mb-1">Nova Reserva Confirmada</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2">O hóspede João Silva acabou de reservar a Suíte Presidencial para o próximo fim de semana.</p>
                        <p className="text-[10px] text-primary mt-2">Há 5 minutos</p>
                      </div>
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                        <p className="text-xs font-bold mb-1">Manutenção Necessária</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2">Ar condicionado do quarto 402 relatado com problemas técnicos.</p>
                        <p className="text-[10px] text-primary mt-2">Há 2 horas</p>
                      </div>
                    </div>
                    <button className="w-full py-3 text-xs text-slate-500 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      Ver todas as notificações
                    </button>
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
                    <div className="p-2 mb-1">
                      <h4 className="font-bold text-xs uppercase text-slate-400">Preferências</h4>
                    </div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className="material-symbols-outlined text-lg">dark_mode</span>
                      <span>Alternar Tema</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className="material-symbols-outlined text-lg">language</span>
                      <span>Idioma: PT-BR</span>
                    </button>
                    <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className="material-symbols-outlined text-lg">account_circle</span>
                      <span>Meu Perfil</span>
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
    </div>
  );
}
