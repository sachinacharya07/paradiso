import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

/**
 * ToastProvider wraps the app and provides toast notifications.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
            onClick={() => {
              setToasts(prev =>
                prev.map(x => (x.id === t.id ? { ...x, exiting: true } : x))
              );
              setTimeout(() => {
                setToasts(prev => prev.filter(x => x.id !== t.id));
              }, 300);
            }}
          >
            <span className="toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast hook returns a toast(message, type) function.
 * type can be 'info', 'success', or 'error'.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
