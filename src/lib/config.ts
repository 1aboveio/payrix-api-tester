import type { PayrixConfig } from './payrix/types';

const CONFIG_KEY = 'payrix_config';

const DEFAULT_CONFIG: PayrixConfig = {
  // Global environment switch
  globalEnvironment: 'test',
  // Derived per-module envs
  environment: 'cert',
  // ... rest unchanged
  expressAcceptorId: '',
  expressAccountId: '',
  expressAccountToken: '',
  applicationId: '1',
  applicationName: 'Payrix POS Tester',
  applicationVersion: '0.1.0',
  tpAuthorization: 'Version=1.0',
  defaultLaneId: '',
  defaultTerminalId: '',
  platformApiKey: '',
  platformEnvironment: 'test',
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
      // Migration: infer globalEnvironment from old configs that don't have it
      let globalEnvironment = parsed.globalEnvironment;
      if (globalEnvironment === undefined) {
        // Old config — infer from per-module fields
        if (parsed.environment === 'prod' || parsed.platformEnvironment === 'prod') {
          globalEnvironment = 'live';
        } else {
          globalEnvironment = 'test';
        }
      }
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        globalEnvironment,
        // Sync per-module envs with global
        environment: globalEnvironment === 'live' ? 'prod' : 'cert',
        platformEnvironment: globalEnvironment === 'live' ? 'prod' : 'test',
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
  return { ...DEFAULT_CONFIG };
}

export function getBaseUrl(environment: 'cert' | 'prod'): string {
  if (environment === 'cert') {
    return 'https://triposcert.vantiv.com';
  }
  return 'https://tripos.vantiv.com';
}

export function getPlatformBaseUrl(environment: 'test' | 'prod'): string {
  return environment === 'test'
    ? 'https://test-api.payrix.com'
    : 'https://api.payrix.com';
}
