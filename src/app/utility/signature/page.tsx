'use client';

import { useMemo, useState } from 'react';

import { signatureStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { signatureTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function SignatureStatusPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ laneId: '' });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const endpoint = `/api/v1/signature/${encodeURIComponent(laneId || '<laneId>')}`;
  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint,
        method: 'GET',
        includeAuthorization: true,
      }),
    [config, endpoint]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Signature Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={signatureTemplates}
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
              const response = await signatureStatusAction({ config, laneId, templateName: templateName || undefined });
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
              <Button type="submit">Execute Signature Status</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true)}
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
