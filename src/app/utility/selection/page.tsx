'use client';

import { useEffect, useMemo, useState } from 'react';

import { selectionStatusAction } from '@/actions/payrix';
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
import { generateRequestId } from '@/lib/payrix/identifiers';
import { selectionTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const FORM_TYPES = [
  { value: 'Default', label: 'Default' },
  { value: 'MultiOption', label: 'Multi Line Text' },
];

export default function SelectionStatusPage() {
  const { config, hydrated } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [form, setForm] = useState('Default');
  const [text, setText] = useState('');
  const [multiLineText, setMultiLineText] = useState('');
  const [options, setOptions] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({ laneId: '' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync laneId with config.defaultLaneId after hydration
  useEffect(() => {
    if (hydrated && config.defaultLaneId) {
      setLaneId(config.defaultLaneId);
    }
  }, [hydrated, config.defaultLaneId]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();

    if (form !== 'Default') {
      params.set('form', form);
    }

    if (form === 'MultiOption') {
      if (multiLineText) params.set('multiLineText', multiLineText);
    } else {
      if (text) params.set('text', text);
    }

    if (options) params.set('options', options);

    const query = params.toString();
    return `/api/v1/selection/${encodeURIComponent(laneId || '<laneId>')}${query ? `?${query}` : ''}`;
  }, [laneId, form, text, multiLineText, options]);

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
      <EndpointInfo method="GET" endpoint="/api/v1/selection/{laneId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Selection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Poll the lane for selection status. Use | to separate multi-line text and options.
          </p>
          <TemplateSelector
            templates={selectionTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setLaneId('');
              setForm('Default');
              setText('');
              setMultiLineText('');
              setOptions('');
              setRequestPreview({ laneId: '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const selectedForm = form === 'Default' ? '' : form;
              const req = { laneId, form: selectedForm || undefined, text: form === 'Default' ? text : undefined, multiLineText: form === 'MultiOption' ? multiLineText : undefined, options };
              setRequestPreview(req);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);
              const response = await selectionStatusAction({ 
                config, 
                requestId: nextRequestId, 
                laneId, 
                form: selectedForm || undefined,
                text: form === 'Default' ? text || undefined : undefined,
                multiLineText: form === 'MultiOption' ? multiLineText || undefined : undefined,
                options: options || undefined,
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
              <Label htmlFor="form">Form Type</Label>
              <Select value={form} onValueChange={setForm}>
                <SelectTrigger id="form">
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Input id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Prompt text" required={form === 'Default'} disabled={form === 'MultiOption'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiLineText">Multi-Line Text <span className="text-xs text-muted-foreground">(| to separate)</span></Label>
              <Input id="multiLineText" value={multiLineText} onChange={(e) => setMultiLineText(e.target.value)} placeholder="Line 1|Line 2|Line 3" required={form === 'MultiOption'} disabled={form === 'Default'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="options">Options <span className="text-xs text-muted-foreground">(| to separate)</span></Label>
              <Input id="options" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option A|Option B|Option C" required />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => { setTemplateId(''); setTemplateName(''); setLaneId(''); setForm('Default'); setText(''); setMultiLineText(''); setOptions(''); }} >Reset</Button>
              <Button type="submit" disabled={!laneId || !options || (form === 'Default' && !text) || (form === 'MultiOption' && !multiLineText)}>Execute Selection Status</Button>
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
        onSaveHistory={result ? () => { addExistingHistoryEntry(result.historyEntry); setSaving(true); } : undefined}
      />
    </div>
  );
}
