'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Plus, 
  Webhook,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listAlertsAction, deleteAlertAction, createAlertAction, listAlertTriggersAction, createAlertTriggerAction, deleteAlertTriggerAction, listAlertActionsAction, createAlertActionAction, deleteAlertActionAction } from '@/actions/platform';
import type { Alert, AlertTrigger, AlertAction } from '@/lib/platform/types';
import { PLATFORM_EVENT_TYPES } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

export default function AlertsPage() {
  const { config } = usePayrixConfig();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggers, setTriggers] = useState<AlertTrigger[]>([]);
  const [actions, setActions] = useState<AlertAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertLoginId, setNewAlertLoginId] = useState('');
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertDescription, setNewAlertDescription] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === 'string') return error;

    if (error && typeof error === 'object' && 'message' in error) {
      const candidate = error as { message?: string };
      if (candidate.message?.trim()) {
        return candidate.message;
      }
    }

    return fallback;
  };

  const isSuccessStatus = (status: number) => status >= 200 && status < 300;

  const getApiErrorMessage = (result: ServerActionResult<unknown>, fallback: string): string | null => {
    if (result.apiResponse.error) {
      return getErrorMessage(result.apiResponse.error, fallback);
    }

    if (!isSuccessStatus(result.apiResponse.status)) {
      return result.apiResponse.statusText || fallback;
    }

    return null;
  };

  const getSingleResultData = <T,>(result: ServerActionResult<unknown>): T | null => {
    const data = result.apiResponse.data as T | T[] | null;

    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    return data as T;
  };

  const getPaginationFromResult = (result: ServerActionResult<unknown>) => {
    const payload = (result.historyEntry.response as {
      response?: {
        details?: {
          page?: {
            current?: number;
            limit?: number;
            total?: number;
          };
        };
      };
    })?.response?.details?.page;

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const current = Number(payload.current);
    const pageLimit = Number(payload.limit);
    const total = Number(payload.total);

    if (!Number.isFinite(current) || !Number.isFinite(pageLimit) || !Number.isFinite(total)) {
      return null;
    }

    if (current <= 0 || pageLimit <= 0 || total < 0) {
      return null;
    }

    return {
      current,
      pageLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageLimit)),
    };
  };

  const fetchAlerts = useCallback(async (page: number = currentPage, pageSize: number = limit) => {
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };

      const targetPage = Math.max(1, page);
      const targetLimit = Math.max(1, pageSize);
      
      const [alertsResult, triggersResult, actionsResult] = await Promise.all([
        listAlertsAction(context, undefined, { page: targetPage, limit: targetLimit }),
        listAlertTriggersAction(context),
        listAlertActionsAction(context),
      ]);
      
      const pagination = getPaginationFromResult(alertsResult);
      const alertsData = (alertsResult.apiResponse.data as Alert[] | undefined) ?? [];
      if (pagination) {
        setCurrentPage(pagination.current);
        setLimit(pagination.pageLimit);
        setTotalPages(pagination.totalPages);
      } else {
        setLimit(targetLimit);
        setCurrentPage(targetPage);
        if (alertsData.length === 0) {
          setTotalPages(Math.max(1, targetPage));
        } else if (alertsData.length < targetLimit) {
          setTotalPages(Math.max(1, targetPage));
        } else {
          setTotalPages(targetPage + 1);
        }
      }
      
      if (alertsResult.apiResponse.data) {
        setAlerts(alertsResult.apiResponse.data as Alert[]);
      } else {
        setAlerts([]);
      }
      if (triggersResult.apiResponse.data) {
        setTriggers(triggersResult.apiResponse.data as AlertTrigger[]);
      } else {
        setTriggers([]);
      }
      if (actionsResult.apiResponse.data) {
        setActions(actionsResult.apiResponse.data as AlertAction[]);
      } else {
        setActions([]);
      }
      
      setResult(alertsResult);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
      setTriggers([]);
      setActions([]);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [config, currentPage, limit]);

  useEffect(() => {
    fetchAlerts(currentPage);
  }, [currentPage, fetchAlerts]);

  const handleCreateAlert = async () => {
    if (!newAlertLoginId.trim()) {
      toast.error('Login ID is required');
      return;
    }
    
    if (!newAlertName.trim()) {
      toast.error('Alert name is required');
      return;
    }

    const trimmedWebhookUrl = webhookUrl.trim();

    if (trimmedWebhookUrl !== '' && selectedEventTypes.length === 0) {
      toast.error('Select at least one event type');
      return;
    }
    
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      const trimmedLoginId = newAlertLoginId.trim();
      
      // Create alert
      const alertResult = await createAlertAction(context, {
        login: trimmedLoginId,
        forlogin: trimmedLoginId,
        name: newAlertName,
        description: newAlertDescription,
      });

      const alertError = getApiErrorMessage(alertResult, 'Failed to create alert');
      if (alertError) {
        toast.error(alertError);
        setLoading(false);
        return;
      }
      
      const alert = getSingleResultData<Alert>(alertResult);
      if (!alert) {
        toast.error('Failed to create alert');
        setLoading(false);
        return;
      }
      
      // Map event type to resource ID
      const resourceMap: Record<string, number> = {
        'txn': 18,
        'terminalTxn': 18,
        'invoice': 95,
        'invoiceResult': 95,
        'chargeback': 34,
        'chargebackdocument': 34,
        'disbursement': 26,
        'disbursementEntries': 26,
        'debit': 26,
        'upcoming': 26,
        'subscription': 24,
        'merchant': 9,
        'account': 1,
        'apikey': 2,
        'changerequest': 3,
        'hold': 4,
        'message': 5,
        'paymentupdate': 6,
        'paymentupdategroup': 7,
        'pendingRiskCheck': 8,
        'reserve': 10,
        'resource': 11,
        'payout': 12,
        'fee': 13,
        'vasEfeOffer': 14,
      };
      
      // Get resource ID for an event type
      const getResourceId = (eventType: string): number => {
        for (const [prefix, id] of Object.entries(resourceMap)) {
          if (eventType.startsWith(prefix)) {
            return id;
          }
        }
        return 18; // default to txn
      };
      
      if (trimmedWebhookUrl !== '') {
        // Create triggers for all selected event types (sequentially)
        for (const eventType of selectedEventTypes) {
          const triggerResult = await createAlertTriggerAction(context, {
            alert: alert.id,
            event: eventType,
            resource: getResourceId(eventType),
            name: `Trigger for ${eventType}`,
          });

          const trigger = getSingleResultData<AlertTrigger>(triggerResult);
          const triggerError = getApiErrorMessage(triggerResult, 'Failed to create trigger');
          if (triggerError || !trigger) {
            const errorMessage = triggerError ?? 'Failed to create trigger';
            toast.error(`Failed to create trigger (${eventType}): ${errorMessage}`);
            setLoading(false);
            return; // Don't show success if triggers failed
          }
        }

        // Create action (webhook) - type must be 'web' not 'webhook', and options must be 'JSON'
        const actionResult = await createAlertActionAction(context, {
          alert: alert.id,
          type: 'web',
          value: trimmedWebhookUrl,
          options: 'JSON',
        });

        // Check for action creation failure
        const action = getSingleResultData<AlertAction>(actionResult);
        const actionError = getApiErrorMessage(actionResult, 'Failed to create webhook action');
        if (actionError || !action) {
          const errorMsg = actionError ?? 'Failed to create webhook action';
          toast.error(`Webhook action failed: ${errorMsg}`);
          setLoading(false);
          return;
        }
      }
      
      toast.success('Alert created successfully');
      setShowCreateModal(false);
      setNewAlertLoginId('');
      setNewAlertName('');
      setNewAlertDescription('');
      setSelectedEventTypes([]);
      setWebhookUrl('');
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert? This will also delete all associated triggers and actions.')) {
      return;
    }
    
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      
      // Delete associated triggers
      const triggersToDelete = triggers.filter(t => t.alert === alertId);
      const triggerResults = await Promise.all(triggersToDelete.map(t => deleteAlertTriggerAction(context, t.id)));
      const triggerErrors = triggerResults
        .filter(r => r.apiResponse.error)
        .map((r) => getErrorMessage(r.apiResponse.error, 'Failed to delete trigger'));

      if (triggerErrors.length > 0) {
        toast.error(`Failed to delete triggers: ${triggerErrors.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Delete associated actions
      const actionsToDelete = actions.filter(a => a.alert === alertId);
      const actionResults = await Promise.all(actionsToDelete.map(a => deleteAlertActionAction(context, a.id)));
      const actionErrors = actionResults
        .filter(r => r.apiResponse.error)
        .map((r) => getErrorMessage(r.apiResponse.error, 'Failed to delete action'));

      if (actionErrors.length > 0) {
        toast.error(`Failed to delete actions: ${actionErrors.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Delete alert
      const deleteResult = await deleteAlertAction(context, alertId);
      const deleteError = getApiErrorMessage(deleteResult, 'Failed to delete alert');
      if (deleteError) {
        toast.error(deleteError);
        setLoading(false);
        return;
      }
      
      toast.success('Alert deleted successfully');
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    } finally {
      setLoading(false);
    }
  };

  // Get triggers/actions for a specific alert
  const getAlertTriggers = (alertId: string) => triggers.filter(t => t.alert === alertId);
  const getAlertActions = (alertId: string) => actions.filter(a => a.alert === alertId);

  // Group events by category (e.g., "txn.created" -> "txn")
  const groupEventsByCategory = (events: readonly string[]): Record<string, string[]> => {
    const groups: Record<string, string[]> = {};
    for (const event of events) {
      const category = event.split('.')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(event);
    }
    // Sort categories and events within each category
    const sorted: Record<string, string[]> = {};
    for (const key of Object.keys(groups).sort()) {
      sorted[key] = groups[key].sort();
    }
    return sorted;
  };

  // Toggle all events in a category
  const toggleCategory = (category: string, events: string[]) => {
    const allSelected = events.every(e => selectedEventTypes.includes(e));
    if (allSelected) {
      // Remove all events in this category
      setSelectedEventTypes(prev => prev.filter(t => !events.includes(t)));
    } else {
      // Add all events in this category
      setSelectedEventTypes(prev => {
        const newEvents = events.filter(e => !prev.includes(e));
        return [...prev, ...newEvents];
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Webhook className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">
              Manage Payrix webhook alerts
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert List</CardTitle>
          <CardDescription>
            Configure when Payrix sends webhooks to your endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts configured</p>
              <p className="text-sm mt-1">
                Create an alert to start receiving webhooks
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Triggers</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>{alert.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getAlertTriggers(alert.id).map((t) => (
                            <Badge key={t.id} variant="secondary" className="text-xs">
                              {t.event}
                            </Badge>
                          ))}
                          {getAlertTriggers(alert.id).length === 0 && (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getAlertActions(alert.id).map((a) => (
                            <Badge key={a.id} variant="outline" className="text-xs">
                              {a.type}: {(a.value ?? '').substring(0, 30)}{a.value && a.value.length > 30 ? '...' : ''}
                            </Badge>
                          ))}
                          {getAlertActions(alert.id).length === 0 && (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(alert.created), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteAlert(alert.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    limit={limit}
                    onPageChange={(page) => {
                      const targetPage = Math.max(1, Math.min(page, totalPages));
                      if (targetPage === currentPage) return;
                      setCurrentPage(targetPage);
                    }}
                    onLimitChange={(nextLimit) => {
                      setCurrentPage(1);
                      fetchAlerts(1, nextLimit);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create Alert</CardTitle>
              <CardDescription>
                Configure a new webhook alert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alertLoginId">Login ID *</Label>
                <Input
                  id="alertLoginId"
                  value={newAlertLoginId}
                  onChange={(e) => setNewAlertLoginId(e.target.value)}
                  placeholder="Your Payrix login ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alertName">Alert Name *</Label>
                <Input
                  id="alertName"
                  value={newAlertName}
                  onChange={(e) => setNewAlertName(e.target.value)}
                  placeholder="My Webhook Alert"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alertDescription">Description</Label>
                <Input
                  id="alertDescription"
                  value={newAlertDescription}
                  onChange={(e) => setNewAlertDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Event Types</Label>
                <div className="border rounded-md max-h-64 overflow-y-auto p-3 space-y-3">
                  {Object.entries(groupEventsByCategory(PLATFORM_EVENT_TYPES)).map(([category, events]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-1 border-b">
                        <span className="text-sm font-medium text-primary capitalize">{category}</span>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category, events)}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {events.every(e => selectedEventTypes.includes(e)) ? 'Clear' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-1">
                        {events.map((event) => (
                          <label key={event} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 py-0.5 rounded">
                            <input
                              type="checkbox"
                              checked={selectedEventTypes.includes(event)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEventTypes(prev => [...prev, event]);
                                } else {
                                  setSelectedEventTypes(prev => prev.filter(t => t !== event));
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedEventTypes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {selectedEventTypes.length} event(s) selected
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedEventTypes([])}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-endpoint.com/api/webhooks/payrix"
                />
                <p className="text-xs text-muted-foreground">
                  The URL where Payrix will send webhook POST requests
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAlert} 
                  disabled={loading || !newAlertLoginId.trim() || !newAlertName.trim() || (webhookUrl.trim() !== '' && selectedEventTypes.length === 0)}
                >
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint="/alerts"
          method="GET"
          requestPreview={{}}
          result={result}
        />
      )}
    </div>
  );
}
