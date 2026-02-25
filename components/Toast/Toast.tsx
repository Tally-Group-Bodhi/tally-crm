"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "info" | "success" | "warning" | "error";
  icon?: string;
  duration: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastContext = React.createContext<{
  toasts: ToastData[];
  addToast: (
    toast: Omit<ToastData, "id" | "duration"> & { duration?: number }
  ) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<ToastData, "id" | "duration"> & { duration?: number }) => {
      const id = Math.random().toString(36).substring(7);
      const duration = toast.duration ?? 6000;
      setToasts((prev) => [...prev, { ...toast, id, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

const variantStyles: Record<
  string,
  { border: string; iconColor: string; bg: string }
> = {
  default: {
    border: "border-border dark:border-gray-700",
    iconColor: "text-muted-foreground",
    bg: "bg-white dark:bg-gray-900",
  },
  info: {
    border: "border-[#006180]/30 dark:border-[#80E0FF]/30",
    iconColor: "text-[#006180] dark:text-[#80E0FF]",
    bg: "bg-[#E6F7FF]/80 dark:bg-[#006180]/10",
  },
  success: {
    border: "border-[#008000]/30 dark:border-green-500/30",
    iconColor: "text-[#008000] dark:text-green-400",
    bg: "bg-green-50/80 dark:bg-green-950/20",
  },
  warning: {
    border: "border-[#C53B00]/30 dark:border-orange-500/30",
    iconColor: "text-[#C53B00] dark:text-orange-400",
    bg: "bg-orange-50/80 dark:bg-orange-950/20",
  },
  error: {
    border: "border-[#C40000]/30 dark:border-red-500/30",
    iconColor: "text-[#C40000] dark:text-red-400",
    bg: "bg-red-50/80 dark:bg-red-950/20",
  },
};

const defaultIcons: Record<string, string> = {
  default: "info",
  info: "info",
  success: "check_circle",
  warning: "warning",
  error: "error",
};

function ToastCard({ toast }: { toast: ToastData }) {
  const { removeToast } = React.useContext(ToastContext);
  const variant = toast.variant ?? "default";
  const styles = variantStyles[variant] ?? variantStyles.default;
  const iconName = toast.icon ?? defaultIcons[variant] ?? "info";

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-3 pr-8 shadow-lg backdrop-blur-sm transition-all",
        styles.border,
        styles.bg
      )}
    >
      <div className={cn("mt-0.5 shrink-0", styles.iconColor)}>
        <Icon name={iconName} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action!.onClick();
              removeToast(toast.id);
            }}
            className="mt-1.5 text-xs font-medium text-[#006180] underline hover:no-underline dark:text-[#80E0FF]"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        className="absolute right-2 top-2 rounded-md p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 focus:opacity-100 focus:outline-none group-hover:opacity-100 dark:text-gray-500 dark:hover:text-gray-300"
        onClick={() => removeToast(toast.id)}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts } = React.useContext(ToastContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
