import type { PayrixConfig } from './types';

interface CurlOptions {
  config: PayrixConfig;
  endpoint: string;
  method: 'GET' | 'POST';
  body?: unknown;
  includeAuthorization?: boolean;
}

function getBaseUrl(environment: PayrixConfig['environment']): string {
  if (environment === 'cert') {
    return 'https://triposcert.vantiv.com';
  }
  return 'https://tripos.vantiv.com';
}

export function buildCurlCommand(options: CurlOptions): string {
  const { config, endpoint, method, body, includeAuthorization } = options;
  const url = `${getBaseUrl(config.environment)}${endpoint}`;

  const lines: string[] = [`curl -X ${method} '${url}'`];

  lines.push(`  -H 'Content-Type: application/json'`);
  lines.push(`  -H 'tp-application-id: ${config.applicationId}'`);
  lines.push(`  -H 'tp-application-name: ${config.applicationName}'`);
  lines.push(`  -H 'tp-application-version: ${config.applicationVersion}'`);
  lines.push(`  -H 'tp-request-id: <generated-uuid>'`);
  lines.push(`  -H 'tp-express-acceptor-id: ${config.expressAcceptorId}'`);
  lines.push(`  -H 'tp-express-account-id: ${config.expressAccountId}'`);
  lines.push(`  -H 'tp-express-account-token: ${config.expressAccountToken}'`);

  if (includeAuthorization) {
    lines.push(`  -H 'tp-authorization: ${config.tpAuthorization}'`);
  }

  if (body !== undefined && method === 'POST') {
    const json = JSON.stringify(body, null, 2);
    lines.push(`  -d '${json}'`);
  }

  return lines.join(' \\\n');
}
