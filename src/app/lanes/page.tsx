'use client';

import { useState } from 'react';

import { getLaneAction, listLanesAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function LanesPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>List Lanes / Get Lane</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                setSaving(false);
                const req = {};
                setRequestPreview(req);              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);


                const response = await listLanesAction({ config, requestId: nextRequestId, request: req });
                setResult(response as ServerActionResult<unknown>);
              }}
            >
              Execute List Lanes
            </Button>
          </div>

          <div className="grid gap-2 md:max-w-sm">
            <Label htmlFor="lane-id">Lane ID</Label>
            <Input id="lane-id" value={laneId} onChange={(event) => setLaneId(event.target.value)} placeholder="Optional lane id" />
            <Button
              variant="outline"
              onClick={async () => {
                if (!laneId) return;
                setSaving(false);
                setRequestPreview({ laneId });              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);


                const response = await getLaneAction({ config, requestId: nextRequestId, laneId });
                setResult(response as ServerActionResult<unknown>);
              }}
            >
              Execute Get Lane
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, false, requestId ?? undefined)}
        requestPreview={requestPreview}
        result={result}
        historySaved={saving}
        onSaveHistory={
          result
            ? () => {
                addExistingHistoryEntry(result.historyEntry);
                setSaving(true);
              }
            : undefined
        }
      />
    </div>
  );
}
