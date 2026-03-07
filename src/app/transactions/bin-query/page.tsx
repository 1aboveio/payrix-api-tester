'use client';

import { useMemo, useState } from 'react';

import { binQueryAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { binQueryTemplates } from '@/lib/payrix/templates';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import type { BinQueryRequest, HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: BinQueryRequest = {
  laneId: '',
};

export default function BinQueryPage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<BinQueryRequest>({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [requestId, setRequestId] = useState<string>(generateRequestId());
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const curlCommand = useMemo(
    () => {
      const query = new URLSearchParams();
      if ((form as { invokeManualEntry?: boolean }).invokeManualEntry !== undefined) {
        query.set('invokeManualEntry', String((form as { invokeManualEntry?: boolean }).invokeManualEntry));
      }
      if ((form as { isCscSupported?: boolean }).isCscSupported !== undefined) {
        query.set('isCscSupported', String((form as { isCscSupported?: boolean }).isCscSupported));
      }
      const queryString = query.toString();
      const laneId = form.laneId || '{laneId}';
      return buildCurlCommand({
        config,
        endpoint: `/api/v1/binQuery/${encodeURIComponent(laneId)}${queryString ? `?${queryString}` : ''}`,
        method: httpMethod,
        body: form,
        includeAuthorization: true,
      });
    },
    [config, form, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="GET" endpoint="/api/v1/binQuery/{laneId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>BIN Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={binQueryTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', ...tpl.fields } as BinQueryRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setRequestId(generateRequestId());
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await binQueryAction({
                  config,
                  requestId,
                  request: form,
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
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(e) => setForm({ ...form, laneId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invokeManualEntry">Invoke Manual Entry</Label>
              <Select
                value={
                  (form as { invokeManualEntry?: boolean }).invokeManualEntry === undefined
                    ? 'unset'
                    : (form as { invokeManualEntry?: boolean }).invokeManualEntry
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    invokeManualEntry: value === 'unset' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger id="invokeManualEntry">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isCscSupported">CSC Supported</Label>
              <Select
                value={
                  (form as { isCscSupported?: boolean }).isCscSupported === undefined
                    ? 'unset'
                    : (form as { isCscSupported?: boolean }).isCscSupported
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    isCscSupported: value === 'unset' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger id="isCscSupported">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
                  setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute BIN Query
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
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
