'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Transaction, TransactionStatus, TransactionType, TransactionOrigin } from '@/lib/platform/types';
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS, TRANSACTION_ORIGIN_LABELS, COF_TYPE_LABELS } from '@/lib/platform/types';

const STATUS_VARIANTS: Record<number, 'default' | 'secondary' | 'destructive'> = {
  0: 'secondary',   // Pending
  1: 'default',     // Approved
  2: 'destructive', // Failed
  3: 'default',     // Captured
  4: 'default',     // Settled
  5: 'secondary',   // Returned
};

function formatCurrency(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);
}

function getCardDisplay(txn: Transaction): string {
  const last4 = typeof txn.payment === 'object' ? txn.payment?.number : undefined;
  const exp = typeof txn.token === 'object' ? txn.token?.expiration : txn.expiration;
  const expFmt = exp ? `${String(exp).slice(0, 2)}/${String(exp).slice(2)}` : '';
  if (last4 && expFmt) return `•••• ${last4} (${expFmt})`;
  if (last4) return `•••• ${last4}`;
  if (expFmt) return expFmt;
  return '-';
}

interface TransactionTableProps {
  transactions: Transaction[];
  /** Show clickable row linking to transaction detail */
  linkToDetail?: boolean;
  /** Columns to show. Defaults to all. */
  columns?: ('date' | 'type' | 'amount' | 'status' | 'cofType' | 'origin' | 'card' | 'auth' | 'descriptor' | 'id' | 'merchant')[];
}

const DEFAULT_COLUMNS: TransactionTableProps['columns'] = [
  'date', 'type', 'amount', 'status', 'cofType', 'origin', 'card', 'auth', 'descriptor',
];

const COLUMN_HEADERS: Record<string, string> = {
  date: 'Date',
  type: 'Type',
  amount: 'Amount',
  status: 'Status',
  cofType: 'CoF Type',
  origin: 'Origin',
  card: 'Card',
  auth: 'Auth',
  descriptor: 'Descriptor',
  id: 'ID',
  merchant: 'Merchant',
};

export function TransactionTable({ transactions, linkToDetail = false, columns: columnsProp }: TransactionTableProps) {
  const columns = columnsProp ?? DEFAULT_COLUMNS!;
  const renderCell = (col: string, txn: Transaction) => {
    switch (col) {
      case 'date':
        return (
          <TableCell className="text-sm whitespace-nowrap">
            {txn.created ? format(new Date(txn.created), 'MMM d, yyyy HH:mm') : '-'}
          </TableCell>
        );
      case 'type':
        return (
          <TableCell className="text-sm">
            {txn.type != null ? (TRANSACTION_TYPE_LABELS[txn.type as TransactionType] || String(txn.type)) : '-'}
          </TableCell>
        );
      case 'amount':
        return (
          <TableCell className="font-medium whitespace-nowrap">
            {formatCurrency(txn.total ?? txn.amount, txn.currency)}
          </TableCell>
        );
      case 'status':
        return (
          <TableCell>
            <Badge variant={STATUS_VARIANTS[txn.status] || 'default'}>
              {TRANSACTION_STATUS_LABELS[txn.status as TransactionStatus] || String(txn.status)}
            </Badge>
          </TableCell>
        );
      case 'cofType':
        return (
          <TableCell className="text-sm">
            {txn.cofType ? (COF_TYPE_LABELS[txn.cofType] || txn.cofType) : '-'}
          </TableCell>
        );
      case 'origin':
        return (
          <TableCell className="text-sm">
            {txn.origin != null ? (TRANSACTION_ORIGIN_LABELS[txn.origin as TransactionOrigin] || String(txn.origin)) : '-'}
          </TableCell>
        );
      case 'card':
        return (
          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
            {getCardDisplay(txn)}
          </TableCell>
        );
      case 'auth':
        return (
          <TableCell className="text-sm font-mono">
            {txn.authorization || txn.authCode || '-'}
          </TableCell>
        );
      case 'descriptor':
        return (
          <TableCell className="text-sm text-muted-foreground">
            {txn.descriptor || '-'}
          </TableCell>
        );
      case 'id':
        return (
          <TableCell className="font-mono text-xs">
            {linkToDetail ? (
              <Link href={`/platform/transactions/${txn.id}`} className="hover:underline">
                {txn.id}
              </Link>
            ) : txn.id}
          </TableCell>
        );
      case 'merchant':
        return (
          <TableCell className="text-sm">
            {typeof txn.merchant === 'string' ? txn.merchant : (txn.merchant as { id: string })?.id || '-'}
          </TableCell>
        );
      default:
        return <TableCell>-</TableCell>;
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{COLUMN_HEADERS[col] || col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              {columns.map((col) => (
                <>{renderCell(col, txn)}</>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
