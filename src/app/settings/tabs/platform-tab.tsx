'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrixConfig } from '@/lib/payrix/types';

interface PlatformTabProps {
  config: PayrixConfig;
  onFieldChange: (field: keyof PayrixConfig, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  wasReset: boolean;
}

export function PlatformTab({ config, onFieldChange, onSave, onReset, saved, wasReset }: PlatformTabProps) {
  return (
    <div className="space-y-4">
      <Card data-testid="environment-card">
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Switch between test and live using the toggle in the header.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Active:</span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                config.globalEnvironment === 'test'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {config.globalEnvironment.toUpperCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform API Credentials</CardTitle>
          <CardDescription>Credentials for Payrix Platform REST APIs (invoices, merchants, customers).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="platform-api-key">API Key</Label>
            <Input
              id="platform-api-key"
              type="password"
              value={config.platformApiKey}
              onChange={(event) => onFieldChange('platformApiKey', event.target.value)}
              placeholder="Your Payrix Platform API key"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={onSave}>Save Settings</Button>
        <Button variant="outline" onClick={onReset}>Reset to Defaults</Button>
      </div>
      {saved && <p className="text-sm text-muted-foreground">Saved to localStorage.</p>}
      {wasReset && <p className="text-sm text-muted-foreground">Reset to default values.</p>}
    </div>
  );
}
