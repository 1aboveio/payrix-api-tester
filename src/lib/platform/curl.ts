import type { PayrixConfig } from '@/lib/payrix/types';
import { getPlatformBaseUrl } from '@/lib/config';
import type { PlatformPagination, PlatformSearchFilter } from './types';
import { buildSearchHeaderValue } from './search';

interface PlatformCurlOptions {
  config: PayrixConfig;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  body?: unknown;
  searchFilters?: PlatformSearchFilter[];
  pagination?: PlatformPagination;
  redactApiKey?: boolean;
}

export function buildPlatformCurlCommand(options: PlatformCurlOptions): string {
  const { config, endpoint, method, body, searchFilters, pagination, redactApiKey = true } = options;
  const baseUrl = getPlatformBaseUrl(config.platformEnvironment);
  const queryParams = new URLSearchParams();
  if (pagination) {
    const limit = pagination.limit ?? 25;
    const offset = pagination.offset ?? ((pagination.page ?? 1) - 1) * limit;
    queryParams.set('page[offset]', String(offset));
    queryParams.set('page[limit]', String(limit));
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
    // Single `search` header — all filters `&`-joined, same-field groups
    // wrapped in and[i] per Payrix's advanced-searches spec.
    lines.push(`  -H 'search: ${buildSearchHeaderValue(searchFilters)}'`);
  }

  if (body !== undefined && normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
    const json = JSON.stringify(body, null, 2);
    lines.push(`  -d '${json}'`);
  }

  return lines.join(' \\\n');
}
