'use client';

import { useEffect, useMemo, useState } from 'react';

import { getConfig, resetConfig, saveConfig } from '@/lib/config';
import type { GlobalEnvironment, PayrixConfig } from '@/lib/payrix/types';

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

  const setGlobalEnvironment = (env: GlobalEnvironment) => {
    const isLive = env === 'live';
    updateConfig({
      ...config,
      globalEnvironment: env,
      environment: isLive ? 'prod' : 'cert',
      platformEnvironment: isLive ? 'prod' : 'test',
    });
  };

  const reset = () => {
    const defaults = resetConfig();
    setConfig(defaults);
  };

  return useMemo(
    () => ({
      config,
      hydrated,
      updateConfig,
      setGlobalEnvironment,
      reset,
    }),
    [config, hydrated]
  );
}

