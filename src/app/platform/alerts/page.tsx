'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Plus, 
  Search,
  Webhook,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Alert, AlertTrigger, AlertAction, PlatformSearchFilter } from '@/lib/platform/types';
import { PLATFORM_EVENT_TYPES } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

export default function AlertsPage() {
  const router = useRouter();
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
  
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const fetchAlerts = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      
      const [alertsResult, triggersResult, actionsResult] = await Promise.all([
        listAlertsAction(context, undefined, { page, limit }),
        listAlertTriggersAction(context),
        listAlertActionsAction(context),
      ]);
      
      if (alertsResult.apiResponse.data) {
        setAlerts(alertsResult.apiResponse.data as Alert[]);
      }
      if (triggersResult.apiResponse.data) {
        setTriggers(triggersResult.apiResponse.data as AlertTrigger[]);
      }
      if (actionsResult.apiResponse.data) {
        setActions(actionsResult.apiResponse.data as AlertAction[]);
      }
      
      setResult(alertsResult);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

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
      
      // Create alert
      const alertResult = await createAlertAction(context, {
        login: newAlertLoginId,
        forlogin: newAlertLoginId,
        name: newAlertName,
        description: newAlertDescription,
      });
      
      if (alertResult.apiResponse.error) {
        toast.error(alertResult.apiResponse.error);
        setLoading(false);
        return;
      }
      
      const alert = (alertResult.apiResponse.data as Alert[])?.[0];
      if (!alert) {
        toast.error('Failed to create alert');
        setLoading(false);
        return;
      }
      
      // If webhook URL provided, create trigger and action
      if (trimmedWebhookUrl !== '') {
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
        
        // Create triggers for all selected event types
        const triggerResults = await Promise.all(selectedEventTypes.map(eventType => 
          createAlertTriggerAction(context, {
            alert: alert.id,
            event: eventType,
            resource: getResourceId(eventType),
            name: `Trigger for ${eventType}`,
          })
        ));
        
        // Check for trigger creation failures
        const triggerErrors = triggerResults.filter(r => r.apiResponse.error);
        if (triggerErrors.length > 0) {
          const err = triggerErrors[0].apiResponse.error;
          const errorMsg = typeof err === 'string' ? err : (err as unknown as { message?: string })?.message || 'Failed to create trigger';
          toast.error(`Trigger creation failed: ${errorMsg}`);
          setLoading(false);
          return; // Don't show success if triggers failed
        }
        
        // Create action (webhook) - type must be 'web' not 'webhook', and options must be 'JSON'
        const actionResult = await createAlertActionAction(context, {
          alert: alert.id,
          type: 'web',
          value: trimmedWebhookUrl,
          options: 'JSON',
        });
        
        // Check for action creation failure
        if (actionResult.apiResponse.error) {
          const errorMsg = typeof actionResult.apiResponse.error === 'string'
            ? actionResult.apiResponse.error
            : (actionResult.apiResponse.error as unknown as { message?: string })?.message || 'Failed to create webhook action';
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
      const triggerErrors = triggerResults.filter(r => r.apiResponse.error);
      if (triggerErrors.length > 0) {
        toast.error('Failed to delete some triggers');
        // Continue anyway
      }
      
      // Delete associated actions
      const actionsToDelete = actions.filter(a => a.alert === alertId);
      const actionResults = await Promise.all(actionsToDelete.map(a => deleteAlertActionAction(context, a.id)));
      const actionErrors = actionResults.filter(r => r.apiResponse.error);
      if (actionErrors.length > 0) {
        toast.error('Failed to delete some actions');
        // Continue anyway
      }
      
      // Delete alert
      const deleteResult = await deleteAlertAction(context, alertId);
      if (deleteResult.apiResponse.error) {
        const errorMsg = typeof deleteResult.apiResponse.error === 'string'
          ? deleteResult.apiResponse.error
          : (deleteResult.apiResponse.error as unknown as { message?: string })?.message || 'Failed to delete alert';
        toast.error(errorMsg);
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
                <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                  {PLATFORM_EVENT_TYPES.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedEventTypes.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEventTypes([...selectedEventTypes, event]);
                          } else {
                            setSelectedEventTypes(selectedEventTypes.filter(t => t !== event));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
                {selectedEventTypes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEventTypes.length} event(s) selected
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
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
                  disabled={loading || !newAlertLoginId.trim() || !newAlertName.trim() || (!!webhookUrl.trim() && selectedEventTypes.length === 0)}
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
