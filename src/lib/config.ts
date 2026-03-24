import type { PayrixConfig, TriposCredentials, PlatformCredentials } from './payrix/types';

const CONFIG_KEY = 'payrix_config';
const CONFIG_SYNC_EVENT = 'payrix-config-sync';

export const CONFIG_SYNC_TOPIC = CONFIG_SYNC_EVENT;

export function dispatchConfigSync(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONFIG_SYNC_EVENT));
  }
}

function emptyTripos(): TriposCredentials {
  return {
    expressAcceptorId: '',
    expressAccountId: '',
    expressAccountToken: '',
    defaultLaneId: '',
    defaultTerminalId: '',
  };
}

function emptyPlatform(): PlatformCredentials {
  return { platformApiKey: '' };
}

const DEFAULT_CONFIG: PayrixConfig = {
  globalEnvironment: 'test',
  environment: 'cert',
  platformEnvironment: 'test',
  tripos: { test: emptyTripos(), live: emptyTripos() },
  platform: { test: emptyPlatform(), live: emptyPlatform() },
  applicationId: '1',
  applicationName: 'Payrix POS Tester',
  applicationVersion: '0.1.0',
  tpAuthorization: 'Version=1.0',
  sunmiAppId: '',
  sunmiAppKey: '',
  // Legacy flat fields kept for TypeScript compat (migrated to nested on load)
  expressAcceptorId: '',
  expressAccountId: '',
  expressAccountToken: '',
  defaultLaneId: '',
  defaultTerminalId: '',
  platformApiKey: '',
};

export function getConfig(): PayrixConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PayrixConfig>;
      const globalEnvironment = parsed.globalEnvironment ?? (parsed.environment === 'prod' || parsed.platformEnvironment === 'prod' ? 'live' : 'test');

      // Migration: if not yet migrated and any legacy credential field exists, copy into both slots
      if (
        parsed._migrated !== true &&
        (parsed.expressAcceptorId ||
          parsed.expressAccountId ||
          parsed.expressAccountToken ||
          parsed.defaultLaneId ||
          parsed.defaultTerminalId ||
          parsed.platformApiKey)
      ) {
        const triposCreds: TriposCredentials = {
          expressAcceptorId: parsed.expressAcceptorId ?? '',
          expressAccountId: parsed.expressAccountId ?? '',
          expressAccountToken: parsed.expressAccountToken ?? '',
          defaultLaneId: parsed.defaultLaneId ?? '',
          defaultTerminalId: parsed.defaultTerminalId ?? '',
        };
        const merged: PayrixConfig = {
          ...DEFAULT_CONFIG,
          ...parsed,
          globalEnvironment,
          environment: globalEnvironment === 'live' ? 'prod' : 'cert',
          platformEnvironment: globalEnvironment === 'live' ? 'prod' : 'test',
          tripos: {
            test: { ...triposCreds },
            live: { ...triposCreds },
          },
          platform: {
            test: { platformApiKey: parsed.platformApiKey ?? '' },
            live: { platformApiKey: parsed.platformApiKey ?? '' },
          },
          _migrated: true,
        };
        // Persist migrated config so migration only runs once
        localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
        return merged;
      }

      // Already migrated or no legacy data — return with nested structure
      // Fall back defaults for missing nested fields
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        globalEnvironment,
        environment: globalEnvironment === 'live' ? 'prod' : 'cert',
        platformEnvironment: globalEnvironment === 'live' ? 'prod' : 'test',
        tripos: {
          test: { ...emptyTripos(), ...(parsed.tripos?.test ?? {}) },
          live: { ...emptyTripos(), ...(parsed.tripos?.live ?? {}) },
        },
        platform: {
          test: { ...emptyPlatform(), ...(parsed.platform?.test ?? {}) },
          live: { ...emptyPlatform(), ...(parsed.platform?.live ?? {}) },
        },
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
    dispatchConfigSync();
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
}

export function resetConfig(): PayrixConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CONFIG_KEY);
      dispatchConfigSync();
    } catch (error) {
      console.error('Error removing config from localStorage:', error);
    }
  }
  return { ...DEFAULT_CONFIG };
}

/** Deep-set a nested field via a dotted path (e.g. 'tripos.test.expressAcceptorId'). */
export function setNestedField(
  config: PayrixConfig,
  path: string,
  value: string
): PayrixConfig {
  const [section, env, field] = path.split('.') as [string, 'test' | 'live', string];
  if (section === 'tripos' && (env === 'test' || env === 'live') && field) {
    return {
      ...config,
      tripos: {
        ...config.tripos,
        [env]: { ...config.tripos[env], [field]: value },
      },
    };
  }
  if (section === 'platform' && (env === 'test' || env === 'live') && field) {
    return {
      ...config,
      platform: {
        ...config.platform,
        [env]: { ...config.platform[env], [field]: value },
      },
    };
  }
  // Fallback for flat fields
  return { ...config, [field]: value } as PayrixConfig;
}

/** Returns the active TriPOS credentials for the current globalEnvironment. */
export function activeTripos(config: PayrixConfig): TriposCredentials {
  return config.tripos[config.globalEnvironment];
}

/** Convenience: active TriPOS defaultLaneId or '' */
export function activeDefaultLaneId(config: PayrixConfig): string {
  return config.tripos[config.globalEnvironment].defaultLaneId || '';
}

/** Convenience: active TriPOS defaultTerminalId or '' */
export function activeDefaultTerminalId(config: PayrixConfig): string {
  return config.tripos[config.globalEnvironment].defaultTerminalId || '';
}

/** Returns the active Platform credentials for the current globalEnvironment. */
export function activePlatform(config: PayrixConfig): PlatformCredentials {
  return config.platform[config.globalEnvironment];
}

/** Convenience: active Platform API key or '' */
export function activePlatformApiKey(config: PayrixConfig): string {
  return config.platform[config.globalEnvironment].platformApiKey || '';
}

export function getBaseUrl(environment: 'cert' | 'prod'): string {
  return environment === 'cert' ? 'https://triposcert.vantiv.com' : 'https://tripos.vantiv.com';
}

export function getPlatformBaseUrl(environment: 'test' | 'prod'): string {
  return environment === 'test' ? 'https://test-api.payrix.com' : 'https://api.payrix.com';
}
