import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  const colors = { success: '#2e7d32', error: '#c62828', info: '#1976d2' };
  const icons = { success: '✓', error: '✗', info: 'ℹ' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex',
        flexDirection: 'column', gap: 8, maxWidth: 360,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', background: colors[t.type], color: '#fff',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideIn 0.25s ease-out',
            fontSize: '0.9em',
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
