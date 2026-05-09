import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return { toasts, toast, removeToast };
}

export function ToastContainer({ toasts, removeToast, colors }) {
  if (toasts.length === 0) return null;

  const typeColors = {
    success: colors?.success || '#10b981',
    error: colors?.error || '#ef4444',
    warning: colors?.warning || '#f59e0b',
    info: colors?.primary || '#7c3aed',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {toasts.map((t, i) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: colors?.bgCard || 'rgba(255,255,255,0.95)',
            border: `1px solid ${typeColors[t.type]}40`,
            borderRadius: 12,
            boxShadow: colors?.shadow || '0 4px 24px rgba(0,0,0,0.15)',
            minWidth: 280,
            animation: `slideIn 0.3s ease, fadeOut 0.3s ease ${t.duration - 300}ms forwards`,
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: typeColors[t.type],
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 'bold',
          }}>
            {icons[t.type]}
          </div>
          <span style={{
            flex: 1,
            fontSize: 14,
            color: colors?.text || '#0f172a',
          }}>
            {t.message}
          </span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: colors?.textMuted || '#94a3b8',
              padding: 0,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
