'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Webhook,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWebhookHistoryAction } from '@/actions/webhooks';
import type { WebhookEvent } from '@/lib/platform/types';

export default function WebhooksMonitorPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getWebhookHistoryAction();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyPayload = (event: WebhookEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEventTypeColor = (eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (eventType.startsWith('txn.')) return 'default';
    if (eventType.startsWith('invoice.')) return 'secondary';
    if (eventType.startsWith('chargeback')) return 'destructive';
    if (eventType.startsWith('disbursement')) return 'outline';
    if (eventType.startsWith('merchant')) return 'secondary';
    if (eventType.startsWith('subscription')) return 'outline';
    return 'default';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Webhook className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Webhook Monitor</h1>
            <p className="text-muted-foreground">
              Live feed of incoming Payrix webhooks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received Events</CardTitle>
          <CardDescription>
            Auto-polls every 5 seconds • Shows last {events.length} of 50 events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhooks received yet</p>
              <p className="text-sm mt-1">
                Configure your Payrix alert to POST to:
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/payrix
              </code>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(event.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedId === event.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Badge variant={getEventTypeColor(event.eventType)}>
                        {event.eventType}
                      </Badge>
                      {event.entityId && (
                        <span className="text-sm text-muted-foreground">
                          ID: {event.entityId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.receivedAt), 'HH:mm:ss')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPayload(event);
                        }}
                      >
                        {copiedId === event.id ? (
                          <span className="text-green-500 text-xs">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {expandedId === event.id && (
                    <div className="border-t p-3 bg-muted/30">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
