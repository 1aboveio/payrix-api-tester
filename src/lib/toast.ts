'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const TOAST_DURATION_MS = 3000;
let toasts: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();

function emit() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

function pushToast(type: ToastType, message: string): string {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  emit();
  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  return id;
}

function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export const toast = {
  success(message: string) {
    return pushToast('success', message);
  },
  error(message: string) {
    return pushToast('error', message);
  },
  info(message: string) {
    return pushToast('info', message);
  },
  dismiss(id: string) {
    dismissToast(id);
  },
};

export function useToastStore() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    setItems(toasts);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return {
    items,
    dismiss: dismissToast,
  };
}
