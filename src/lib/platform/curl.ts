import type { PayrixConfig } from '@/lib/payrix/types';
import { getPlatformBaseUrl } from '@/lib/config';

interface PlatformCurlOptions {
  config: PayrixConfig;
  endpoint: string;
  method: string;
  body?: unknown;
  searchFilters?: Array<{ field: string; operator: string; value: unknown }>;
}

function buildSearchHeader(filters: Array<{ field: string; operator: string; value: unknown }>): string {
  return filters
    .map(f => {
      const value = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
      return `${f.field}[${f.operator}]=${encodeURIComponent(value)}`;
    })
    .join(';');
}

export function buildPlatformCurlCommand(options: PlatformCurlOptions): string {
  const { config, endpoint, method, body, searchFilters } = options;
  const baseUrl = getPlatformBaseUrl(config.platformEnvironment);
  const url = `${baseUrl}${endpoint}`;

  const normalizedMethod = method.toUpperCase();
  const lines: string[] = [`curl -X ${normalizedMethod} '${url}'`];

  lines.push(`  -H 'APIKEY: ${config.platformApiKey || '\u003capi-key\u003e'}'`);
  lines.push(`  -H 'Content-Type: application/json'`);

  if (searchFilters && searchFilters.length > 0) {
    lines.push(`  -H 'search: ${buildSearchHeader(searchFilters)}'`);
  }

  if (body !== undefined && normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
    const json = JSON.stringify(body, null, 2);
    lines.push(`  -d '${json}'`);
  }

  return lines.join(' \\\\n');
}
