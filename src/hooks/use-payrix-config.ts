'use client';

import { useEffect, useMemo, useState } from 'react';

import { getConfig, saveConfig } from '@/lib/config';
import type { PayrixConfig } from '@/lib/payrix/types';

export function usePayrixConfig() {
  const [config, setConfig] = useState<PayrixConfig>(() => getConfig());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
    setHydrated(true);
  }, []);

  const updateConfig = (next: PayrixConfig) => {
    setConfig(next);
    saveConfig(next);
  };

  return useMemo(
    () => ({
      config,
      hydrated,
      updateConfig,
    }),
    [config, hydrated]
  );
}
