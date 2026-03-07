'use client';

import { useEffect, useMemo, useState } from 'react';

import { signatureStatusAction } from '@/actions/payrix';
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
import { signatureTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult } from '@/lib/payrix/types';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { addExistingHistoryEntry } from '@/lib/storage';

const FORM_TYPES = [
  { value: 'none', label: 'Default' },
  { value: 'simple', label: 'Simple' },
  { value: 'contract', label: 'Contract' },
];

export default function SignatureStatusPage() {
  const { config, hydrated } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [form, setForm] = useState('');
  const [header, setHeader] = useState('');
  const [subHeader, setSubHeader] = useState('');
  const [text, setText] = useState('');
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
    if (form && form !== 'none') params.set('form', form);
    if (header) params.set('header', header);
    if (subHeader) params.set('subHeader', subHeader);
    if (text) params.set('text', text);
    const query = params.toString();
    return `/api/v1/signature/${encodeURIComponent(laneId || '<laneId>')}${query ? `?${query}` : ''}`;
  }, [laneId, form, header, subHeader, text]);

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
      <EndpointInfo method="GET" endpoint="/api/v1/signature/{laneId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Signature Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={signatureTemplates}
            selectedId={templateId}
            onSelect={(tpl) => { setTemplateId(tpl.id); setTemplateName(tpl.name); }}
            onReset={() => { setTemplateId(''); setTemplateName(''); setLaneId(''); setForm(''); setHeader(''); setSubHeader(''); setText(''); setRequestPreview({ laneId: '' }); }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const req = { laneId, form, header, subHeader, text };
              setRequestPreview(req);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);
              const response = await signatureStatusAction({ 
                config, requestId: nextRequestId, laneId, 
                form: form && form !== 'none' ? form : undefined, header: header || undefined, 
                subHeader: subHeader || undefined, text: text || undefined, 
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
                <SelectTrigger id="form"><SelectValue placeholder="Select form type" /></SelectTrigger>
                <SelectContent>{FORM_TYPES.map((ft) => (<SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="header">Header</Label>
              <Input id="header" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Signature header" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subHeader">Sub-Header</Label>
              <Input id="subHeader" value={subHeader} onChange={(e) => setSubHeader(e.target.value)} placeholder="Signature sub-header" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Input id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Signature text" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => { setTemplateId(''); setTemplateName(''); setLaneId(''); setForm(''); setHeader(''); setSubHeader(''); setText(''); }}>Reset</Button>
              <Button type="submit">Execute Signature Status</Button>
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
