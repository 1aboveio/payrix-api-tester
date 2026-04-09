'use client';

import { useEffect, useMemo, useState } from 'react';

import { CONFIG_SYNC_TOPIC, activeDefaultLaneId, activeDefaultTerminalId, activePlatform, activePlatformApiKey, activeTripos, getConfig, resetConfig, saveConfig, setNestedField } from '@/lib/config';
import type { GlobalEnvironment, PayrixConfig } from '@/lib/payrix/types';
import { resolvePlatformCredentialsAction } from '@/actions/platform';

/** Returns a PayrixConfig with flat credential aliases populated from the active set. */
function withAliases(cfg: PayrixConfig): PayrixConfig {
  const tripos = activeTripos(cfg);
  const platform = activePlatform(cfg);
  return {
    ...cfg,
    expressAcceptorId: tripos.expressAcceptorId,
    expressAccountId: tripos.expressAccountId,
    expressAccountToken: tripos.expressAccountToken,
    defaultLaneId: tripos.defaultLaneId || '',
    defaultTerminalId: tripos.defaultTerminalId || '',
    platformApiKey: platform.platformApiKey || '',
  };
}

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

  // Auto-resolve platformLogin and platformMerchant when API key is set but merchant is missing
  useEffect(() => {
    const platform = activePlatform(config);
    if (!platform.platformApiKey || platform.platformMerchant) return;

    let cancelled = false;
    resolvePlatformCredentialsAction(
      platform.platformApiKey,
      config.globalEnvironment === 'test' ? 'test' : 'prod'
    ).then((result) => {
      if (cancelled) return;
      if (result.success) {
        const env = config.globalEnvironment;
        const next = { ...config };
        if (result.login) {
          next.platform = { ...next.platform, [env]: { ...next.platform[env], platformLogin: result.login } };
        }
        if (result.merchant) {
          next.platform = { ...next.platform, [env]: { ...next.platform[env], platformMerchant: result.merchant } };
        }
        setConfig(next);
        saveConfig(next);
      }
    });
    return () => { cancelled = true; };
  }, [config.globalEnvironment, activePlatform(config).platformApiKey]);

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

  /** Updates a nested config field via a dotted path (e.g. 'tripos.test.expressAcceptorId'). */
  const updateNestedField = (path: string, value: string) => {
    const next = setNestedField(config, path, value);
    updateConfig(next);
  };

  return useMemo(
    () => ({
      config: withAliases(config),
      hydrated,
      updateConfig,
      updateNestedField,
      setGlobalEnvironment,
      reset,
    }),
    [config, hydrated]
  );
}

