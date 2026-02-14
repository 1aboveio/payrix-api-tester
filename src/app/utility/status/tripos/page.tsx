'use client';

import { useMemo, useState } from 'react';

import { triPosStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { triPosStatusTemplates } from '@/lib/payrix/templates';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { toast } from '@/lib/toast';
import type { HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function TriPosStatusPage() {
  const { config } = usePayrixConfig();
  const [echo, setEcho] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [requestPreview, setRequestPreview] = useState<unknown>({ echo: '' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const endpoint = `/api/v1/status/triPOS/${encodeURIComponent(echo || '<echo>')}`;
  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint,
        method: httpMethod,
        includeAuthorization: true,
      }),
    [config, endpoint, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="GET" endpoint="/api/v1/status/triPOS/{echo}" docsUrl="https://docs.payrix.com/reference" />
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
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await triPosStatusAction({
                  config,
                  requestId: nextRequestId,
                  echo,
                  templateName: templateName || undefined,
                  httpMethod: httpMethod as HttpMethod,
                });
                setResult(response as ServerActionResult<unknown>);
                toast.success('Request sent');
              } finally {
                setSubmitting(false);
              }
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
              <Button type="submit" disabled={submitting}>
                Execute triPOS Status
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={requestPreview}
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
