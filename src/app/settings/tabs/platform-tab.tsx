'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrixConfig } from '@/lib/payrix/types';

interface PlatformTabProps {
  config: PayrixConfig;
  onFieldChange: (field: string, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  wasReset: boolean;
}

function CredentialFields({
  env,
  prefix,
  config,
  onFieldChange,
}: {
  env: 'test' | 'live';
  prefix: string;
  config: PayrixConfig;
  onFieldChange: (field: string, value: string) => void;
}) {
  const creds = config.platform[env];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{env === 'test' ? 'Test' : 'Live'} API Key</CardTitle>
          {config.globalEnvironment === env && (
            <span className="inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900 dark:text-orange-200">
              Active
            </span>
          )}
        </div>
        <CardDescription>
          {env === 'test'
            ? 'Test environment — test-api.payrix.com'
            : 'Production environment — api.payrix.com'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-api-key`}>Platform API Key</Label>
          <Input
            id={`${prefix}-api-key`}
            type="text"
            value={creds.platformApiKey}
            onChange={(e) => onFieldChange(`${prefix}.platformApiKey`, e.target.value)}
            placeholder="Your Payrix Platform API key"
          />
        </div>
      </CardContent>
    </Card>
  );
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
          <div className="flex flex-col gap-1">
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
            <span className="text-xs text-muted-foreground font-mono">
              {config.platformEnvironment === 'prod' ? 'api.payrix.com' : 'test-api.payrix.com'}
            </span>
          </div>
        </CardContent>
      </Card>

      {config.globalEnvironment === 'test' && <CredentialFields env="test" prefix="platform.test" config={config} onFieldChange={onFieldChange} />}
      {config.globalEnvironment === 'live' && <CredentialFields env="live" prefix="platform.live" config={config} onFieldChange={onFieldChange} />}

      <div className="flex items-center gap-4">
        <Button onClick={onSave}>Save Settings</Button>
        <Button variant="outline" onClick={onReset}>Reset to Defaults</Button>
      </div>
      {saved && <p className="text-sm text-muted-foreground">Saved to localStorage.</p>}
      {wasReset && <p className="text-sm text-muted-foreground">Reset to default values.</p>}
    </div>
  );
}
