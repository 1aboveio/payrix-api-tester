'use client';

import { useMemo, useState } from 'react';

import { triPosStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { triPosStatusTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function TriPosStatusPage() {
  const { config } = usePayrixConfig();
  const [echo, setEcho] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ echo: '' });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const endpoint = `/api/v1/status/triPOS/${encodeURIComponent(echo || '<echo>')}`;
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
          <CardTitle>triPOS Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={triPosStatusTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              const nextEcho = typeof tpl.fields.echo === 'string' ? tpl.fields.echo : '';
              setEcho(nextEcho);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setEcho('');
              setRequestPreview({ echo: '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const req = { echo };
              setRequestPreview(req);
              const response = await triPosStatusAction({ config, echo, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="echo">Echo</Label>
              <Input id="echo" value={echo} onChange={(e) => setEcho(e.target.value)} placeholder="ping" required />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
                  setEcho('');
                  setRequestPreview({ echo: '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit">Execute triPOS Status</Button>
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
