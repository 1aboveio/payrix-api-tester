'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrinterSettingsCard } from '@/components/printer/printer-settings';
import type { PayrixConfig } from '@/lib/payrix/types';

interface PrinterTabProps {
  config: PayrixConfig;
  onFieldChange: (field: string, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  wasReset: boolean;
}

export function PrinterTab({ config, onFieldChange, onSave, onReset, saved, wasReset }: PrinterTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sunmi Data Cloud Credentials</CardTitle>
          <CardDescription>
            APP ID and APP Key for Sunmi Digital Store bind/unbind API. Overrides server env vars when set.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sunmi-app-id">APP ID</Label>
            <Input
              id="sunmi-app-id"
              value={config.sunmiAppId}
              onChange={(event) => onFieldChange('sunmiAppId', event.target.value)}
              placeholder="e.g. d53261e21cb641d2965126d4dcb6e9b3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sunmi-app-key">APP Key</Label>
            <Input
              id="sunmi-app-key"
              type="password"
              value={config.sunmiAppKey}
              onChange={(event) => onFieldChange('sunmiAppKey', event.target.value)}
              placeholder="Your Sunmi APP Key"
            />
          </div>
        </CardContent>
      </Card>

      <PrinterSettingsCard />

      <div className="flex items-center gap-4">
        <Button onClick={onSave}>Save Settings</Button>
        <Button variant="outline" onClick={onReset}>Reset to Defaults</Button>
      </div>
      {saved && <p className="text-sm text-muted-foreground">Saved to localStorage.</p>}
      {wasReset && <p className="text-sm text-muted-foreground">Reset to default values.</p>}
    </div>
  );
}
