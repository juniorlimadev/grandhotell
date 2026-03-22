import { useState, useEffect } from "react";

/**
 * Componente de Modal de Confirmação Profissional.
 * Substitui o window.confirm por uma interface elegante e moderna.
 */
export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Sim, Continuar", cancelText = "Não, Voltar", isDanger = true }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
      document.body.style.overflow = "hidden";
    } else {
      setShow(false);
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 transform ${show ? "scale-100 translate-y-0" : "scale-90 translate-y-4"}`}>
        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto size-16 rounded-2xl flex items-center justify-center mb-6 ${isDanger ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
            <span className="material-symbols-outlined text-3xl font-bold">
              {isDanger ? "warning" : "help_outline"}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex border-t border-slate-50 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <div className="w-px bg-slate-50 dark:bg-slate-800"></div>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${isDanger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-primary hover:bg-primary/10"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
