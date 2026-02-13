'use client';

import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

import { useToastStore } from '@/lib/toast';
import { Button } from '@/components/ui/button';

export function AppToaster() {
  const { items, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex items-start gap-2 rounded-md border bg-card px-3 py-2 shadow-md"
          role="status"
          aria-live="polite"
        >
          {item.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-4 text-green-500" />
          ) : item.type === 'error' ? (
            <CircleAlert className="mt-0.5 size-4 text-red-500" />
          ) : (
            <Info className="mt-0.5 size-4 text-blue-500" />
          )}
          <p className="flex-1 text-sm">{item.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss toast"
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
