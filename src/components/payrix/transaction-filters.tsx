'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface TransactionFilterValues {
  terminalId: string;
  startDate: string;
  endDate: string;
  transactionId?: string;
  referenceNumber?: string;
  maxPageSize: number;
}

interface TransactionFiltersProps {
  onSubmit: (filters: TransactionFilterValues) => void;
  loading?: boolean;
  defaultTerminalId?: string;
}

export function TransactionFilters({ onSubmit, loading, defaultTerminalId }: TransactionFiltersProps) {
  const { defaultStartDate, defaultEndDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const toDateInput = (value: Date) => {
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    return {
      defaultStartDate: toDateInput(start),
      defaultEndDate: toDateInput(end),
    };
  }, []);

  const [form, setForm] = useState({
    terminalId: defaultTerminalId || '',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    transactionId: '',
    referenceNumber: '',
    maxPageSize: 100,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultTerminalId) {
      return;
    }
    setForm((prev) => (prev.terminalId ? prev : { ...prev, terminalId: defaultTerminalId }));
  }, [defaultTerminalId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.terminalId.trim()) {
      setError('Terminal ID is required.');
      return;
    }
    if (!form.startDate.trim()) {
      setError('Start Date is required.');
      return;
    }
    if (!form.endDate.trim()) {
      setError('End Date is required.');
      return;
    }
    if (form.startDate > form.endDate) {
      setError('Start Date must be before or equal to End Date.');
      return;
    }

    onSubmit({
      terminalId: form.terminalId.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      transactionId: form.transactionId.trim() || undefined,
      referenceNumber: form.referenceNumber.trim() || undefined,
      maxPageSize: Math.max(1, form.maxPageSize),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tf-terminalId">Terminal ID *</Label>
            <Input
              id="tf-terminalId"
              value={form.terminalId}
              onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tf-startDate">Start Date *</Label>
            <Input
              id="tf-startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tf-endDate">End Date *</Label>
            <Input
              id="tf-endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tf-transactionId">Transaction ID</Label>
            <Input
              id="tf-transactionId"
              value={form.transactionId}
              onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tf-referenceNumber">Reference Number</Label>
            <Input
              id="tf-referenceNumber"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tf-maxPageSize">Max Page Size</Label>
            <Input
              id="tf-maxPageSize"
              type="number"
              min={1}
              max={500}
              value={form.maxPageSize}
              onChange={(e) => setForm({ ...form, maxPageSize: Number(e.target.value) || 1 })}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Transactions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
