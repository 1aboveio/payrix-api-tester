'use client';

import { useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getLaneAction, listLanesAction, deleteLaneAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import type { ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function LanesPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'list' | 'get' | 'delete' | null>(null);
  const [lastAction, setLastAction] = useState<'list' | 'get' | 'delete' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>('');

  const curlCommand = useMemo(() => {
    if (lastAction === 'list') {
      return buildCurlCommand({
        config,
        endpoint: '/cloudapi/v1/lanes',
        method: 'GET',
        body: requestPreview,
        includeAuthorization: false,
      });
    }
    // Use submitted laneId from requestPreview, not live input state
    const submittedLaneId = (requestPreview as { laneId?: string })?.laneId;
    if (lastAction === 'get' && submittedLaneId) {
      return buildCurlCommand({
        config,
        endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(submittedLaneId)}`,
        method: 'GET',
        body: requestPreview,
        includeAuthorization: false,
      });
    }
    if (lastAction === 'delete' && submittedLaneId) {
      return buildCurlCommand({
        config,
        endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(submittedLaneId)}`,
        method: 'DELETE',
        body: undefined,
        includeAuthorization: false,
      });
    }
    return undefined;
  }, [config, lastAction, requestPreview]);

  const runListLanes = async () => {
    setSaving(false);
    const req = {};
    setRequestPreview(req);
    setLastAction('list');
    const nextRequestId = crypto.randomUUID();
    setRequestId(nextRequestId);
    setLoadingAction('list');

    try {
      const response = await listLanesAction({ config, requestId: nextRequestId, request: req });
      setResult(response as ServerActionResult<unknown>);
    } finally {
      setLoadingAction(null);
    }
  };

  const runGetLane = async () => {
    if (!laneId) {
      return;
    }

    setSaving(false);
    setRequestPreview({ laneId });
    setLastAction('get');
    const nextRequestId = crypto.randomUUID();
    setRequestId(nextRequestId);
    setLoadingAction('get');

    try {
      const response = await getLaneAction({ config, requestId: nextRequestId, laneId });
      setResult(response as ServerActionResult<unknown>);
    } finally {
      setLoadingAction(null);
    }
  };

  const runDeleteLane = async () => {
    if (!deleteConfirmId) return;
    setSaving(false);
    setRequestPreview({ laneId: deleteConfirmId });
    setLastAction('delete');
    const nextRequestId = crypto.randomUUID();
    setRequestId(nextRequestId);
    setLoadingAction('delete');
    try {
      const response = await deleteLaneAction({ config, requestId: nextRequestId, laneId: deleteConfirmId });
      setResult(response as ServerActionResult<unknown>);
    } finally {
      setLoadingAction(null);
      setDeleteConfirmId('');
    }
  };

  const loading = loadingAction !== null;

  return (
    <div className="space-y-4">
      <EndpointInfo method="GET" endpoint="/cloudapi/v1/lanes" docsUrl="https://docs.payrix.com/reference" />
      <EndpointInfo method="GET" endpoint="/cloudapi/v1/lanes/{laneId}" docsUrl="https://docs.payrix.com/reference" />

      <Card>
        <CardHeader>
          <CardTitle>List Lanes / Get Lane</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runListLanes} disabled={loading}>
              {loadingAction === 'list' && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Execute List Lanes
            </Button>
          </div>

          <div className="grid gap-2 md:max-w-sm">
            <Label htmlFor="lane-id">Lane ID</Label>
            <Input
              id="lane-id"
              value={laneId}
              onChange={(event) => setLaneId(event.target.value)}
              placeholder="Optional lane id"
              disabled={loading}
            />
            <Button variant="outline" onClick={runGetLane} disabled={loading || !laneId}>
              {loadingAction === 'get' && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Execute Get Lane
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, false, requestId ?? undefined)}
        requestPreview={requestPreview}
        result={result}
        loading={loading}
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

      <Card>
        <CardHeader>
          <CardTitle>Delete Lane</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:max-w-sm">
            <Label htmlFor="delete-lane-id">Lane ID</Label>
            <Input
              id="delete-lane-id"
              value={deleteConfirmId}
              onChange={(event) => setDeleteConfirmId(event.target.value)}
              placeholder="Lane ID to delete"
              disabled={loading}
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={loading || !deleteConfirmId}
                onClick={() => setDeleteConfirmId(deleteConfirmId)}
              >
                {loadingAction === 'delete' && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                Delete Lane
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete lane {deleteConfirmId}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will unpair the device and cannot be undone. All pending transactions will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={runDeleteLane}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete Lane
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
