'use client';

import { useMemo, useState } from 'react';

import { hostStatusAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { hostStatusTemplates } from '@/lib/payrix/templates';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { toast } from '@/lib/toast';
import type { HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function HostStatusPage() {
  const { config } = usePayrixConfig();
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/status/host',
        method: httpMethod,
        includeAuthorization: true,
      }),
    [config, httpMethod]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Host Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={hostStatusTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setRequestPreview({});
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTemplateId('');
                setTemplateName('');
                setRequestPreview({});
              }}
            >
              Reset
            </Button>
            <Button
              onClick={async () => {
                setSaving(false);
                setSubmitting(true);
                setRequestPreview({});
                toast.info('Sending request...');
                try {
                  const nextRequestId = crypto.randomUUID();
                  setRequestId(nextRequestId);
                  const response = await hostStatusAction({
                    config,
                    requestId: nextRequestId,
                    templateName: templateName || undefined,
                    httpMethod: httpMethod as HttpMethod,
                  });
                  setResult(response as ServerActionResult<unknown>);
                  toast.success('Request sent');
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              Execute Host Status
            </Button>
          </div>
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
