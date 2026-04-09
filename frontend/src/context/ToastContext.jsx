import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ message, type = 'info', action = null, duration = 5000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const toast = { id, message, type, action };
        
        setToasts(prev => [...prev, toast]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-md px-4">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-white/10 backdrop-blur-md bg-opacity-90"
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' && (
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                            )}
                            {toast.type === 'delete' && (
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            )}
                            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                        </div>
                        
                        {toast.action && (
                            <button 
                                onClick={() => {
                                    toast.action.onClick();
                                    removeToast(toast.id);
                                }}
                                className="bg-white/10 hover:bg-white/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                {toast.action.label}
                            </button>
                        )}

                        {!toast.action && (
                             <button 
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
