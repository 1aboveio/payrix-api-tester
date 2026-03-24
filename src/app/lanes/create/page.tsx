'use client';

import { useState } from 'react';

import { createLaneAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { toast } from '@/lib/toast';
import type { CreateLaneRequest, HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';
import { activeTripos } from '@/lib/config';

export default function CreateLanePage() {
  const { config } = usePayrixConfig();
  const defaultForm: CreateLaneRequest = {
    laneId: activeTripos(config).defaultLaneId || '',
    terminalId: activeTripos(config).defaultTerminalId || '',
    activationCode: '',
  };
  const [form, setForm] = useState<CreateLaneRequest>({
    ...defaultForm,
  });
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const curlCommand = buildCurlCommand({
    config,
    endpoint: '/cloudapi/v1/lanes',
    method: httpMethod,
    body: form,
  });

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/cloudapi/v1/lanes" docsUrl="https://docs.payrix.com/reference" />
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
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await createLaneAction({
                  config,
                  requestId: nextRequestId,
                  request: form,
                  httpMethod: httpMethod as HttpMethod,
                });
                setResult(response as ServerActionResult<unknown>);
                toast.success('Request sent');
              } finally {
                setSubmitting(false);
              }
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
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                Execute
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setForm(defaultForm);
                  setResult(null);
                  setSaving(false);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, false, requestId ?? undefined)}
        requestPreview={form}
        httpMethod={httpMethod}
        onHttpMethodChange={setHttpMethod}
        loading={submitting}
        result={result}
        curlCommand={curlCommand}
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
