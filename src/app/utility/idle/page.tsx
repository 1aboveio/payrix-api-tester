'use client';

import { useMemo, useState } from 'react';

import { idleAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { idleTemplates } from '@/lib/payrix/templates';
import type { IdleRequest, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: IdleRequest = {
  laneId: '',
};

export default function IdlePage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<IdleRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/idle',
        method: 'POST',
        body: form,
        includeAuthorization: true,
      }),
    [config, form]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Idle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={idleTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, ...tpl.fields } as IdleRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setForm({ ...DEFAULTS });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const response = await idleAction({ config, request: form, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(e) => setForm({ ...form, laneId: e.target.value })} required />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
                  setForm({ ...DEFAULTS });
                }}
              >
                Reset
              </Button>
              <Button type="submit">Execute Idle</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestPreview={form}
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
