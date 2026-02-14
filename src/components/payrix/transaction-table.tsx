'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Transaction } from '@/lib/payrix/types';
import { type FlatTransaction, flattenTransaction } from '@/lib/payrix/transaction-utils';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (tx: Transaction) => void;
  defaultSort?: { key: string; desc?: boolean };
  totalCount?: number;
}

type FlatTransactionRow = FlatTransaction & { __sourceIndex: number };

export function TransactionTable({ transactions, onRowClick, defaultSort, totalCount }: TransactionTableProps) {
  const flatData = useMemo<FlatTransactionRow[]>(
    () => transactions.map((tx, index) => ({ ...flattenTransaction(tx), __sourceIndex: index })),
    [transactions]
  );

  const allColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of flatData) {
      for (const key of Object.keys(row)) {
        if (key !== '__sourceIndex') {
          keys.add(key);
        }
      }
    }
    return Array.from(keys);
  }, [flatData]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [rearrangeColumn, setRearrangeColumn] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (!defaultSort?.key) {
      return [];
    }
    return [{ id: defaultSort.key, desc: Boolean(defaultSort.desc) }];
  });
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  useEffect(() => {
    if (allColumns.length === 0) {
      setColumnVisibility({});
      setColumnOrder([]);
      setRearrangeColumn('');
      return;
    }

    setColumnVisibility((prev) => {
      const next: VisibilityState = {};
      for (const col of allColumns) {
        next[col] = prev[col] ?? true;
      }
      return next;
    });

    setColumnOrder((prev) => {
      const validPrev = prev.filter((col) => allColumns.includes(col));
      const missing = allColumns.filter((col) => !validPrev.includes(col));
      return [...validPrev, ...missing];
    });

    setRearrangeColumn((prev) => (prev && allColumns.includes(prev) ? prev : allColumns[0]));
  }, [allColumns]);

  const columns = useMemo<ColumnDef<FlatTransactionRow>[]>(
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

  const table = useReactTable({
    data: flatData,
    columns,
    state: {
      columnVisibility,
      columnOrder,
      globalFilter,
      sorting,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue ?? '').toLowerCase().trim();
      if (!term) {
        return true;
      }
      return Object.entries(row.original)
        .filter(([key]) => key !== '__sourceIndex')
        .some(([, value]) => String(value ?? '').toLowerCase().includes(term));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const moveColumn = (direction: 'left' | 'right') => {
    if (!rearrangeColumn || columnOrder.length < 2) {
      return;
    }
    const currentIndex = columnOrder.indexOf(rearrangeColumn);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) {
      return;
    }

    const next = [...columnOrder];
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);
    setColumnOrder(next);
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No transactions found. Adjust your filters and try again.
        </CardContent>
      </Card>
    );
  }

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>
          Results ({filteredCount}
          {typeof totalCount === 'number' ? ` of ${totalCount}` : ''})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowColumnControls((prev) => !prev)}>
          {showColumnControls ? 'Hide Columns' : 'Column Controls'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-sm"
            placeholder="Filter loaded transactions..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              table.setPageIndex(0);
            }}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Page size
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showColumnControls && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="column-reorder">
                Rearrange
              </label>
              <select
                id="column-reorder"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={rearrangeColumn}
                onChange={(event) => setRearrangeColumn(event.target.value)}
              >
                {columnOrder.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveColumn('left')}
                disabled={!rearrangeColumn || columnOrder.indexOf(rearrangeColumn) <= 0}
              >
                Move Left
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveColumn('right')}
                disabled={!rearrangeColumn || columnOrder.indexOf(rearrangeColumn) >= columnOrder.length - 1}
              >
                Move Right
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>
        )}

        <div className="max-h-[70vh] overflow-auto rounded-md border border-border">
          <table className="min-w-max text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium"
                      onClick={header.column.getToggleSortingHandler()}
                    >
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
                  onClick={() => onRowClick?.(transactions[row.original.__sourceIndex])}
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

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            First
          </Button>
          <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
            disabled={!table.getCanNextPage()}
          >
            Last
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
