import type { PayrixConfig } from '@/lib/payrix/types';
import { getPlatformBaseUrl } from '@/lib/config';
import type { PlatformPagination } from './types';

interface PlatformCurlOptions {
  config: PayrixConfig;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  body?: unknown;
  searchFilters?: Array<{ field: string; operator: string; value: unknown }>;
  pagination?: PlatformPagination;
  redactApiKey?: boolean;
}

function buildSearchHeader(filters: Array<{ field: string; operator: string; value: unknown }>): string {
  return filters
    .map((f) => {
      const value = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
      return `${f.field}[${f.operator}]=${encodeURIComponent(value)}`;
    })
    .join(';');
}

export function buildPlatformCurlCommand(options: PlatformCurlOptions): string {
  const { config, endpoint, method, body, searchFilters, pagination, redactApiKey = true } = options;
  const baseUrl = getPlatformBaseUrl(config.platformEnvironment);
  const queryParams = new URLSearchParams();
  if (pagination) {
    const offset = pagination.offset ?? ((pagination.page ?? 1) - 1) * pagination.limit;
    queryParams.set('page[offset]', String(offset));
    queryParams.set('page[limit]', String(pagination.limit));
  }
  const query = queryParams.toString();
  const url = `${baseUrl}${endpoint}${query ? `?${query}` : ''}`;

  const normalizedMethod = method.toUpperCase();
  const lines: string[] = [`curl -X ${normalizedMethod} '${url}'`];

  const apiKeyValue = config.platformApiKey
    ? (redactApiKey ? '[redacted]' : config.platformApiKey)
    : '<api-key>';
  lines.push(`  -H 'APIKEY: ${apiKeyValue}'`);
  lines.push(`  -H 'Content-Type: application/json'`);

  if (searchFilters && searchFilters.length > 0) {
    lines.push(`  -H 'search: ${buildSearchHeader(searchFilters)}'`);
  }

  if (body !== undefined && normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
    const json = JSON.stringify(body, null, 2);
    lines.push(`  -d '${json}'`);
  }

  return lines.join(' \\\n');
}
