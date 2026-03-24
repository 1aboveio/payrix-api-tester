'use client';

import { useEffect, useMemo, useState } from 'react';

import { laneConnectionStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { laneConnectionStatusTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { activeTripos } from '@/lib/config';

export default function LaneConnectionStatusPage() {
  const { config, hydrated } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ laneId: '' });
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    setRequestId(generateRequestId());
  }, []);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated && activeTripos(config).defaultLaneId || '') {
      setLaneId(activeTripos(config).defaultLaneId || '');
    }
  }, [hydrated, activeTripos(config).defaultLaneId || '']);
  const endpoint = `/cloudapi/v1/lanes/${encodeURIComponent(laneId || '<laneId>')}/connectionstatus`;
  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint,
        method: 'GET',
      }),
    [config, endpoint]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="GET" endpoint="/cloudapi/v1/lanes/{laneId}/connectionstatus" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Lane Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={laneConnectionStatusTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setLaneId(activeTripos(config).defaultLaneId || '');
              setRequestPreview({ laneId: activeTripos(config).defaultLaneId || '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const req = { laneId };
              setRequestPreview(req);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);


              const response = await laneConnectionStatusAction({ config, requestId: nextRequestId, laneId, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={laneId} onChange={(e) => setLaneId(e.target.value)} required />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
                  setLaneId(activeTripos(config).defaultLaneId || '');
                  setRequestPreview({ laneId: activeTripos(config).defaultLaneId || '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit">Execute Connection Status</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, false, requestId ?? undefined)}
        requestPreview={requestPreview}
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
