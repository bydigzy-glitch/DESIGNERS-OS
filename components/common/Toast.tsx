
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColors = {
    SUCCESS: 'bg-green-500/10 border-green-500/20 text-green-400',
    ERROR: 'bg-red-500/10 border-red-500/20 text-red-400',
    INFO: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  const icons = {
    SUCCESS: <CheckCircle2 size={18} />,
    ERROR: <AlertCircle size={18} />,
    INFO: <AlertCircle size={18} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg min-w-[300px] ${bgColors[toast.type]}`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-bold">{toast.message}</div>
      <button 
        onClick={() => onDismiss(toast.id)} 
        className="p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};
