import type { PayrixConfig } from './payrix/types';

const CONFIG_KEY = 'payrix_config';

const DEFAULT_CONFIG: PayrixConfig = {
  environment: 'cert',
  expressAcceptorId: '',
  expressAccountId: '',
  expressAccountToken: '',
  applicationId: 'payrix-pos-tester',
  applicationName: 'Payrix POS Tester',
  applicationVersion: '0.1.0',
  tpAuthorization: 'Version=1.0',
};

export function getConfig(): PayrixConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading config from localStorage:', error);
  }

  return DEFAULT_CONFIG;
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

export function getBaseUrl(environment: 'cert' | 'prod'): string {
  if (environment === 'cert') {
    return 'https://triposcert.vantiv.com';
  }
  // TODO: Update with actual prod URL when available
  return 'https://tripos.vantiv.com';
}
