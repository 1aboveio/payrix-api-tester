'use client';

import { useEffect, useMemo, useState } from 'react';

import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { buildPlatformCurlCommand } from '@/lib/platform/curl';
import { buildSearchHeaderValue } from '@/lib/platform/search';
import type { PlatformPagination, PlatformSearchFilter } from '@/lib/platform/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PayrixConfig } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

interface PlatformApiResultPanelProps {
  config: PayrixConfig;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestPreview: unknown;
  result: ServerActionResult<unknown> | null;
  loading?: boolean;
  searchFilters?: PlatformSearchFilter[];
  pagination?: PlatformPagination;
}

function buildPlatformHeaderPreview(
  searchFilters?: PlatformSearchFilter[],
): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {
    APIKEY: '[redacted]',
    'Content-Type': 'application/json',
  };

  const value = buildSearchHeaderValue(searchFilters);
  if (value) headers.search = value;

  return headers;
}

export function PlatformApiResultPanel({
  config,
  endpoint,
  method,
  requestPreview,
  result,
  loading,
  searchFilters,
  pagination,
}: PlatformApiResultPanelProps) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(false);
  }, [result?.historyEntry.id]);

  const curlCommand = useMemo(
    () =>
      buildPlatformCurlCommand({
        config,
        endpoint,
        method,
        body: requestPreview,
        searchFilters,
        pagination,
        redactApiKey: true,
      }),
    [config, endpoint, method, pagination, requestPreview, searchFilters]
  );

  return (
    <ApiResultPanel
      requestHeaders={buildPlatformHeaderPreview(searchFilters)}
      requestPreview={requestPreview}
      result={result}
      loading={loading}
      curlCommand={curlCommand}
      historySaved={saved}
      onSaveHistory={
        result
          ? () => {
              addExistingHistoryEntry(result.historyEntry);
              setSaved(true);
            }
          : undefined
      }
    />
  );
}
