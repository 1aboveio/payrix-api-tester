'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServerActionResult } from '@/lib/payrix/types';

interface ApiResultPanelProps {
  requestPreview: unknown;
  result: ServerActionResult<unknown> | null;
  onSaveHistory?: () => void;
  historySaved?: boolean;
  quickActions?: React.ReactNode;
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ApiResultPanel({
  requestPreview,
  result,
  onSaveHistory,
  historySaved,
  quickActions,
}: ApiResultPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Request Preview</CardTitle>
          <CardDescription>Payload sent to server action.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{toJson(requestPreview)}</pre>
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
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
            {result ? toJson(result.apiResponse.data ?? { error: result.apiResponse.error }) : 'Execute request to view response.'}
          </pre>
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
