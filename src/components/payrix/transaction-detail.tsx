'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/payrix/types';
import { groupTransactionFields } from '@/lib/payrix/transaction-utils';
import type { TransactionResponseData } from '@/lib/payrix/dal/transaction-responses';

interface TransactionDetailProps {
  transaction: Transaction;
  raw?: unknown;
  storedResponses?: TransactionResponseData[];
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleString();
}

export function TransactionDetail({ transaction, raw, storedResponses = [] }: TransactionDetailProps) {
  const groups = useMemo(
    () => groupTransactionFields(transaction as Record<string, unknown>),
    [transaction]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.label}>
            <CardHeader>
              <CardTitle className="text-base">{group.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {group.fields.map(({ key, value }) => (
                  <div key={key} className="flex items-baseline justify-between gap-4">
                    <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                    <dd className="text-sm">{value === null || value === undefined ? '-' : String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stored API Responses from DB */}
      {storedResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved API Responses ({storedResponses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storedResponses.map((resp) => (
              <div key={resp.id} className="rounded-md border p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-mono font-medium">
                    {resp.method} {resp.endpoint}
                  </span>
                  <span className="text-muted-foreground">
                    {resp.statusCode} {resp.statusText} • {resp.duration ? `${resp.duration}ms` : 'N/A'} • {formatDate(resp.createdAt)}
                  </span>
                </div>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {toJson(resp.responseData)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
            {toJson(raw ?? transaction)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
