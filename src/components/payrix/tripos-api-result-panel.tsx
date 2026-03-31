"use client";

import { useState } from 'react';
import { Check, Copy, LoaderCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServerActionResult } from '@/lib/payrix/types';

interface TriposApiResultPanelProps {
  requestPreview: unknown;
  requestHeaders?: Record<string, string>;
  result: ServerActionResult<unknown> | null;
  onSaveHistory?: () => void;
  historySaved?: boolean;
  loading?: boolean;
  baseUrl?: string;
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

function buildTriposCurlCommand(
  preview: unknown,
  headers: Record<string, string> | undefined,
  triposBaseUrl: string
): string {
  const url = `${triposBaseUrl}/api/v1/transactionQuery`;
  const lines = [`curl -X POST '${url}'`];

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      lines.push(`  -H '${key}: ${value}'`);
    }
  }

  const body = toJson(preview);
  lines.push(`  -d '${body}'`);

  return lines.join(' \\n');
}

export function TriposApiResultPanel({
  requestPreview,
  requestHeaders,
  result,
  onSaveHistory,
  historySaved,
  loading,
  baseUrl = 'https://cert.tposcloud.com',
}: TriposApiResultPanelProps) {
  const jsonPreview = toJson(requestPreview);
  const headersPreview = requestHeaders ? toJson(requestHeaders) : '';
  const responsePreview = result
    ? toJson(result.apiResponse.data ?? { error: result.apiResponse.error })
    : '';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
            <LoaderCircle className="size-6 animate-spin" />
          </div>
        )}
        <CardHeader>
          <CardTitle>Request Preview</CardTitle>
          <CardDescription>Payload sent to TriPOS transactionQuery API.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="json">
            <TabsList>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="relative">
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase text-muted-foreground">Body</h3>
                    <CopyButton text={jsonPreview} />
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{jsonPreview}</pre>
                </div>
                {requestHeaders && Object.keys(requestHeaders).length > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-xs font-medium uppercase text-muted-foreground">Headers</h3>
                      <CopyButton text={headersPreview} />
                    </div>
                    <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{headersPreview}</pre>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="curl" className="relative">
              <div className="absolute right-2 top-2">
                <CopyButton text={buildTriposCurlCommand(requestPreview, requestHeaders, baseUrl)} />
              </div>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-all">
                {buildTriposCurlCommand(requestPreview, requestHeaders, baseUrl)}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
            <LoaderCircle className="size-6 animate-spin" />
          </div>
        )}
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
              <Button
                onClick={onSaveHistory}
                disabled={!result || historySaved || loading}
                variant="secondary"
              >
                {historySaved ? 'Saved to History' : 'Save to History'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
