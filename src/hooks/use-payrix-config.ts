'use client';

import { useEffect, useMemo, useState } from 'react';

import { CONFIG_SYNC_TOPIC, getConfig, resetConfig, saveConfig } from '@/lib/config';
import type { GlobalEnvironment, PayrixConfig } from '@/lib/payrix/types';

export function usePayrixConfig() {
  const [config, setConfig] = useState<PayrixConfig>(() => getConfig());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
    setHydrated(true);

    const handleSync = () => {
      setConfig(getConfig());
    };
    window.addEventListener(CONFIG_SYNC_TOPIC, handleSync);
    return () => window.removeEventListener(CONFIG_SYNC_TOPIC, handleSync);
  }, []);

  const updateConfig = (next: PayrixConfig) => {
    setConfig(next);
    saveConfig(next);
  };

  /** Atomically switches all environment flags to the target global mode. */
  const setGlobalEnvironment = (env: GlobalEnvironment) => {
    const next: PayrixConfig = {
      ...config,
      globalEnvironment: env,
      environment: env === 'live' ? 'prod' : 'cert',
      platformEnvironment: env === 'live' ? 'prod' : 'test',
    };
    updateConfig(next);
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
