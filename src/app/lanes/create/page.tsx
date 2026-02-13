'use client';

import { useState } from 'react';

import { createLaneAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { CreateLaneRequest, ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function CreateLanePage() {
  const { config, requestId: nextRequestId } = usePayrixConfig();
  const [form, setForm] = useState<CreateLaneRequest>({ laneId: '', terminalId: '', activationCode: '' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Lane</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              const response = await createLaneAction({ config, requestId: nextRequestId, request: form });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(event) => setForm({ ...form, laneId: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminalId">Terminal ID</Label>
              <Input
                id="terminalId"
                value={form.terminalId}
                onChange={(event) => setForm({ ...form, terminalId: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="activationCode">Activation Code</Label>
              <Input
                id="activationCode"
                value={form.activationCode}
                onChange={(event) => setForm({ ...form, activationCode: event.target.value })}
                required
              />
            </div>
            <Button className="md:col-span-2" type="submit">
              Execute
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, false, requestId ?? undefined)}
        requestPreview={form}
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
