'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let toastQueue: Toast[] = [];
let setToasts: ((toasts: Toast[]) => void) | null = null;

export const toast = {
  success: (message: string, duration = 4000) => addToast({ message, type: 'success', duration }),
  error: (message: string, duration = 6000) => addToast({ message, type: 'error', duration }),
  warning: (message: string, duration = 5000) => addToast({ message, type: 'warning', duration }),
  info: (message: string, duration = 4000) => addToast({ message, type: 'info', duration }),
};

function addToast(toast: Omit<Toast, 'id'>) {
  const newToast: Toast = {
    ...toast,
    id: Math.random().toString(36).substring(2),
  };
  
  toastQueue = [...toastQueue, newToast];
  setToasts?.(toastQueue);

  if (toast.duration && toast.duration > 0) {
    setTimeout(() => {
      removeToast(newToast.id);
    }, toast.duration);
  }
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter(toast => toast.id !== id);
  setToasts?.(toastQueue);
}

export function Toaster() {
  const [toasts, setToastsState] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToasts = setToastsState;
    return () => {
      setToasts = null;
    };
  }, []);

  if (!mounted) return null;

  const toastStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-80 p-4 rounded-lg border shadow-lg flex items-center justify-between animate-slide-up ${toastStyles[toast.type]}`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}