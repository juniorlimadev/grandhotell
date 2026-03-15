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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full">
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
      <main className="flex-1 ml-64 min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-80 focus:ring-2 focus:ring-primary"
                placeholder="Pesquisar quartos, hóspedes ou IDs..."
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
