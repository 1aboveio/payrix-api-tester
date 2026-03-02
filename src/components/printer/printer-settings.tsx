'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { getPrinterService } from '@/lib/printer';

interface PrinterSettings {
  enabled: boolean;
  autoPrint: boolean;
}

const STORAGE_KEY = 'printer_settings';

export function PrinterSettingsCard() {
  const [settings, setSettings] = useState<PrinterSettings>({
    enabled: true,
    autoPrint: false,
  });
  const [printerStatus, setPrinterStatus] = useState<{
    available: boolean;
    status?: string;
  }>({ available: false });
  const [loading, setLoading] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Check printer status
  useEffect(() => {
    const checkStatus = async () => {
      const service = getPrinterService();
      const status = await service.getStatus();
      setPrinterStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveSettings = (newSettings: PrinterSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleTestPrint = async () => {
    setLoading(true);
    const service = getPrinterService();
    try {
      await service.testPrint();
      toast.success('Test print successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test print failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Printer Settings</CardTitle>
        <CardDescription>Configure receipt printing options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Printer Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Printer Status</Label>
            <p className="text-sm text-muted-foreground">
              {printerStatus.available ? 'Ready' : 'Not detected'}
            </p>
          </div>
          <Badge variant={printerStatus.available ? 'default' : 'secondary'}>
            {printerStatus.status || (printerStatus.available ? 'Connected' : 'Offline')}
          </Badge>
        </div>

        {/* Enable Printer */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Printer</Label>
            <p className="text-sm text-muted-foreground">
              Show print buttons in transaction forms
            </p>
          </div>
          <Button
            variant={settings.enabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => saveSettings({ ...settings, enabled: !settings.enabled })}
          >
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Auto Print */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-print after sale</Label>
            <p className="text-sm text-muted-foreground">
              Automatically print receipt after successful transaction
            </p>
          </div>
          <Button
            variant={settings.autoPrint ? 'default' : 'outline'}
            size="sm"
            onClick={() => saveSettings({ ...settings, autoPrint: !settings.autoPrint })}
            disabled={!settings.enabled}
          >
            {settings.autoPrint ? 'On' : 'Off'}
          </Button>
        </div>

        {/* Test Print */}
        <Button
          variant="outline"
          onClick={handleTestPrint}
          disabled={loading || !printerStatus.available}
          className="w-full"
        >
          {loading ? 'Printing...' : 'Test Print'}
        </Button>
      </CardContent>
    </Card>
  );
}
