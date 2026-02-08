'use client';

import { useEffect, useMemo, useState } from 'react';

import { getServerHistoryAction } from '@/actions/payrix';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearHistory, deleteHistoryEntry, getHistory } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/payrix/types';

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function HistoryPage() {
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [serverHistory, setServerHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setLocalHistory(getHistory());
    getServerHistoryAction().then(setServerHistory).catch(() => setServerHistory([]));
  }, []);

  const entries = useMemo(() => {
    const map = new Map<string, HistoryEntry>();

    [...localHistory, ...serverHistory].forEach((entry) => {
      map.set(entry.id, entry);
    });

    return Array.from(map.values()).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [localHistory, serverHistory]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setLocalHistory(getHistory());
            getServerHistoryAction().then(setServerHistory).catch(() => setServerHistory([]));
          }}
        >
          Refresh
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            clearHistory();
            setLocalHistory([]);
          }}
        >
          Clear Local History
        </Button>
      </div>

      {entries.length === 0 && <p className="text-sm text-muted-foreground">No history entries yet.</p>}

      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {entry.method} {entry.endpoint}
            </CardTitle>
            <CardDescription>
              {new Date(entry.timestamp).toLocaleString()} | Status: {entry.status} {entry.statusText}
              {typeof entry.duration === 'number' ? ` | ${entry.duration}ms` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Request</h3>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{formatJson(entry.request)}</pre>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Response</h3>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{formatJson(entry.response)}</pre>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                deleteHistoryEntry(entry.id);
                setLocalHistory(getHistory());
              }}
            >
              Delete Local Copy
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
