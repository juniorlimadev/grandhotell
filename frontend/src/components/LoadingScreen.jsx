export default function LoadingScreen({ title = "Carregando...", subtitle = "Aguarde um instante" }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 via-slate-50 to-slate-100 dark:from-primary/10 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md p-8">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">hotel</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="size-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="flex-1">
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {new Date().getSeconds() % 2 === 0 ? "Sincronizando com o servidor..." : "Preparando sua sessão..."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

