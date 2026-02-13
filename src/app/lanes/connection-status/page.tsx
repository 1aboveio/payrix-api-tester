'use client';

import { useMemo, useState } from 'react';

import { laneConnectionStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
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

export default function LaneConnectionStatusPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ laneId: '' });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

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
              setLaneId('');
              setRequestPreview({ laneId: '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const req = { laneId };
              setRequestPreview(req);
              const response = await laneConnectionStatusAction({ config, laneId, templateName: templateName || undefined });
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
                  setLaneId('');
                  setRequestPreview({ laneId: '' });
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
        requestHeaders={buildHeaderPreview(config, false)}
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
