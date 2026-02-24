'use client';

import { useMemo, useState } from 'react';

import { inputStatusAction } from '@/actions/payrix';
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
import { inputTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const PROMPT_TYPES = [
  { value: '', label: 'Default' },
  { value: 'Amount', label: 'Amount' },
  { value: 'AccountNumber', label: 'Account Number' },
  { value: 'ZIPCode', label: 'ZIP Code' },
];

const FORMAT_TYPES = [
  { value: '', label: 'Default' },
  { value: 'AmountWithDollarCommaDecimal', label: 'Amount With Dollar/Comma/Decimal' },
  { value: 'Numeric', label: 'Numeric' },
];

export default function InputStatusPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [promptType, setPromptType] = useState('');
  const [formatType, setFormatType] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ laneId: '' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (promptType) params.set('promptType', promptType);
    if (formatType) params.set('formatType', formatType);
    const query = params.toString();
    return `/api/v1/input/${encodeURIComponent(laneId || '<laneId>')}${query ? `?${query}` : ''}`;
  }, [laneId, promptType, formatType]);

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
      <EndpointInfo method="GET" endpoint="/api/v1/input/{laneId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Input Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={inputTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setLaneId('');
              setPromptType('');
              setFormatType('');
              setRequestPreview({ laneId: '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const req = { laneId, promptType, formatType };
              setRequestPreview(req);
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              const response = await inputStatusAction({ 
                config, 
                requestId: nextRequestId, 
                laneId, 
                promptType: promptType || undefined,
                formatType: formatType || undefined,
                templateName: templateName || undefined 
              });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={laneId} onChange={(e) => setLaneId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promptType">Prompt Type</Label>
              <Select value={promptType} onValueChange={setPromptType}>
                <SelectTrigger id="promptType">
                  <SelectValue placeholder="Select prompt type" />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formatType">Format Type</Label>
              <Select value={formatType} onValueChange={setFormatType}>
                <SelectTrigger id="formatType">
                  <SelectValue placeholder="Select format type" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
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
                  setLaneId('');
                  setPromptType('');
                  setFormatType('');
                  setRequestPreview({ laneId: '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit">Execute Input Status</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
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
