'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServerActionResult } from '@/lib/payrix/types';

interface ApiResultPanelProps {
  requestPreview: unknown;
  result: ServerActionResult<unknown> | null;
  onSaveHistory?: () => void;
  historySaved?: boolean;
  quickActions?: React.ReactNode;
  curlCommand?: string;
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export function ApiResultPanel({
  requestPreview,
  result,
  onSaveHistory,
  historySaved,
  quickActions,
  curlCommand,
}: ApiResultPanelProps) {
  const jsonPreview = toJson(requestPreview);
  const responsePreview = result ? toJson(result.apiResponse.data ?? { error: result.apiResponse.error }) : '';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Request Preview</CardTitle>
          <CardDescription>Payload sent to server action.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="json">
            <TabsList>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="relative">
              <div className="absolute right-2 top-2">
                <CopyButton text={jsonPreview} />
              </div>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{jsonPreview}</pre>
            </TabsContent>
            <TabsContent value="curl" className="relative">
              {curlCommand ? (
                <>
                  <div className="absolute right-2 top-2">
                    <CopyButton text={curlCommand} />
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-all">{curlCommand}</pre>
                </>
              ) : (
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
                  cURL preview unavailable. Configure settings first.
                </pre>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Response</CardTitle>
            <CardDescription>Formatted API response payload.</CardDescription>
          </div>
          {result && (
            <Badge variant={result.apiResponse.error ? 'destructive' : 'default'}>
              {result.apiResponse.status} {result.apiResponse.statusText}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            {result && (
              <div className="absolute right-2 top-2">
                <CopyButton text={responsePreview} />
              </div>
            )}
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
              {result ? responsePreview : 'Execute request to view response.'}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            {onSaveHistory && (
              <Button onClick={onSaveHistory} disabled={!result || historySaved} variant="secondary">
                {historySaved ? 'Saved to History' : 'Save to History'}
              </Button>
            )}
            {quickActions}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
