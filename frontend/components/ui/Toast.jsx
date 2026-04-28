'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

const ToastContext = createContext(null);

const config = {
  success: { icon: <CheckCircle size={15}/>, style: 'border-green-200 bg-green-50 text-green-900' },
  error:   { icon: <XCircle size={15}/>,     style: 'border-red-200 bg-red-50 text-red-900' },
  warning: { icon: <AlertCircle size={15}/>, style: 'border-orange-200 bg-[#FFF0EB] text-[#FF4D00]' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'success', duration = 4000 }) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const c = config[t.type] || config.success;
          return (
            <div key={t.id}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border',
                'shadow-[0_4px_24px_rgba(0,0,0,0.08)] min-w-[300px] max-w-sm',
                'text-sm font-medium pointer-events-auto', c.style
              )}>
              {c.icon}
              <span className="flex-1">{t.message}</span>
              <button onClick={() => setToasts(t2 => t2.filter(x => x.id !== t.id))}
                className="opacity-60 hover:opacity-100 transition-opacity">
                <X size={13}/>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);