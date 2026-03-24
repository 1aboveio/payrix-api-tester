import type { PayrixConfig } from './payrix/types';

const CONFIG_KEY = 'payrix_config';

const DEFAULT_CONFIG: PayrixConfig = {
  // Global environment switch (Phase 1 — affects both TriPOS and Platform)
  globalEnvironment: 'test',
  environment: 'cert',
  expressAcceptorId: '',
  expressAccountId: '',
  expressAccountToken: '',
  applicationId: '1',
  applicationName: 'Payrix POS Tester',
  applicationVersion: '0.1.0',
  tpAuthorization: 'Version=1.0',
  defaultLaneId: '',
  defaultTerminalId: '',
  // Platform API defaults
  platformApiKey: '',
  platformEnvironment: 'test',
  // Sunmi Data Cloud credentials
  sunmiAppId: '',
  sunmiAppKey: '',
};

export function getConfig(): PayrixConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PayrixConfig>;
      // Migration: if no globalEnvironment, infer from legacy per-module fields
      let globalEnv = parsed.globalEnvironment as 'test' | 'live' | undefined;
      if (!globalEnv) {
        globalEnv =
          parsed.environment === 'prod' || parsed.platformEnvironment === 'prod'
            ? 'live'
            : 'test';
      }
      // Derive per-module envs from global (source of truth)
      const isLive = globalEnv === 'live';
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        globalEnvironment: globalEnv,
        environment: isLive ? 'prod' : 'cert',
        platformEnvironment: isLive ? 'prod' : 'test',
        // Normalize string fields that may be null/undefined in old stored configs
        expressAcceptorId: parsed.expressAcceptorId ?? '',
      };
    }
  } catch (error) {
    console.error('Error reading config from localStorage:', error);
  }

  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: PayrixConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
}

export function resetConfig(): PayrixConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch (error) {
      console.error('Error removing config from localStorage:', error);
    }
  }
  // Return a fresh copy with expressAcceptorId explicitly set to ""
  // (not the shared DEFAULT_CONFIG reference, and not undefined)
  return { ...DEFAULT_CONFIG, expressAcceptorId: '' };
}

export function getBaseUrl(environment: 'cert' | 'prod'): string {
  if (environment === 'cert') {
    return 'https://triposcert.vantiv.com';
  }
  // TODO: Update with actual prod URL when available
  return 'https://tripos.vantiv.com';
}

export function getPlatformBaseUrl(environment: 'test' | 'prod'): string {
  return environment === 'test' 
    ? 'https://test-api.payrix.com' 
    : 'https://api.payrix.com';
}
