'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, LoaderCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServerActionResult } from '@/lib/payrix/types';

interface ApiResultPanelProps {
  requestPreview: unknown;
  requestHeaders?: Record<string, string>;
  result: ServerActionResult<unknown> | null;
  onSaveHistory?: () => void;
  historySaved?: boolean;
  quickActions?: React.ReactNode;
  curlCommand?: string;
  httpMethod?: string;
  onHttpMethodChange?: (method: string) => void;
  loading?: boolean;
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

// Methods that don't support request bodies
const NO_BODY_METHODS = new Set(['GET', 'HEAD']);

export function ApiResultPanel({
  requestPreview,
  requestHeaders,
  result,
  onSaveHistory,
  historySaved,
  quickActions,
  curlCommand,
  httpMethod,
  onHttpMethodChange,
  loading,
}: ApiResultPanelProps) {
  const jsonPreview = toJson(requestPreview);
  const headersPreview = requestHeaders ? toJson(requestHeaders) : '';
  const responsePreview = result ? toJson(result.apiResponse.data ?? { error: result.apiResponse.error }) : '';

  // Check if the current method drops the body
  const methodDropsBody = useMemo(() => {
    if (!httpMethod) return false;
    return NO_BODY_METHODS.has(httpMethod.toUpperCase());
  }, [httpMethod]);

  // Check if there's a meaningful body
  const hasBody = useMemo(() => {
    if (!requestPreview) return false;
    if (typeof requestPreview === 'object' && requestPreview !== null) {
      return Object.keys(requestPreview).length > 0;
    }
    return true;
  }, [requestPreview]);

  const showBodyWarning = methodDropsBody && hasBody;

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
          <CardDescription>Payload sent to server action.</CardDescription>
          {onHttpMethodChange && (
            <div className="space-y-1 pt-2">
              <Label htmlFor="http-method">HTTP Verb</Label>
              <Input
                id="http-method"
                className="max-w-32 uppercase"
                value={httpMethod ?? ''}
                onChange={(event) => onHttpMethodChange(event.target.value.toUpperCase())}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showBodyWarning && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Body will be dropped</p>
                  <p className="text-muted-foreground">
                    {httpMethod?.toUpperCase()} requests do not support request bodies. The body shown in the JSON
                    preview will not be included in the actual API call. Use POST, PUT, or PATCH to send body data.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase text-muted-foreground">Headers</h3>
                    <CopyButton text={headersPreview} />
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">{headersPreview || '{}'}</pre>
                </div>
              </div>
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
              <Button onClick={onSaveHistory} disabled={!result || historySaved || loading} variant="secondary">
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
