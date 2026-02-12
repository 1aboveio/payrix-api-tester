'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/payrix/types';
import { groupTransactionFields } from '@/lib/payrix/transaction-utils';

interface TransactionDetailProps {
  transaction: Transaction;
  raw?: unknown;
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function TransactionDetail({ transaction, raw }: TransactionDetailProps) {
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
