'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/payrix/types';
import { type FlatTransaction, flattenTransaction } from '@/lib/payrix/transaction-utils';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (tx: Transaction) => void;
  defaultSort?: { key: string; desc?: boolean };
}

export function TransactionTable({ transactions, onRowClick, defaultSort }: TransactionTableProps) {
  const flatData = useMemo(() => transactions.map(flattenTransaction), [transactions]);

  const allColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of flatData) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }, [flatData]);

  const initialVisibility = useMemo(() => {
    const vis: VisibilityState = {};
    for (const col of allColumns) {
      vis[col] = true;
    }
    return vis;
  }, [allColumns]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility);
  const [showColumnToggles, setShowColumnToggles] = useState(false);

  const columns = useMemo<ColumnDef<FlatTransaction>[]>(
    () =>
      allColumns.map((key) => ({
        id: key,
        accessorKey: key,
        header: key,
        cell: ({ getValue }) => {
          const val = getValue();
          if (val === null || val === undefined) return <span className="text-muted-foreground">-</span>;
          const text = String(val);
          const isTransactionId = key.toLowerCase() === 'transactionid';
          if (isTransactionId) {
            return (
              <Link
                href={`/transactions/${encodeURIComponent(text)}`}
                className="text-primary underline-offset-2 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {text}
              </Link>
            );
          }
          return text;
        },
      })),
    [allColumns]
  );

  const sortedData = useMemo(() => {
    if (!defaultSort?.key) return flatData;
    const key = defaultSort.key;
    const sorted = [...flatData].sort((a, b) => {
      const left = (a as Record<string, unknown>)[key];
      const right = (b as Record<string, unknown>)[key];
      const leftStr = left == null ? '' : String(left);
      const rightStr = right == null ? '' : String(right);
      if (leftStr === rightStr) return 0;
      return leftStr > rightStr ? 1 : -1;
    });
    return defaultSort.desc ? sorted.reverse() : sorted;
  }, [flatData, defaultSort]);

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No transactions found. Adjust your filters and try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Results ({transactions.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowColumnToggles((prev) => !prev)}>
          {showColumnToggles ? 'Hide Columns' : 'Toggle Columns'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showColumnToggles && (
          <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
            {allColumns.map((col) => {
              const visible = columnVisibility[col] !== false;
              return (
                <Button
                  key={col}
                  variant={visible ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [col]: !visible,
                    }))
                  }
                >
                  {col}
                </Button>
              );
            })}
          </div>
        )}

        <div className="overflow-auto rounded-md border border-border">
          <table className="min-w-max text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-border transition-colors hover:bg-muted/30 ${onRowClick ? 'cursor-pointer' : ''} ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                  onClick={() => onRowClick?.(transactions[row.index])}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
