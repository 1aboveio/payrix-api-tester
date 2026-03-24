'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrixConfig } from '@/lib/payrix/types';

interface TriposTabProps {
  config: PayrixConfig;
  onFieldChange: (field: keyof PayrixConfig, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  wasReset: boolean;
}

export function TriposTab({ config, onFieldChange, onSave, onReset, saved, wasReset }: TriposTabProps) {
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
              {config.environment === 'prod' ? 'tripos.vantiv.com' : 'triposcert.vantiv.com'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Request Values</CardTitle>
          <CardDescription>Automatically prefill lane and terminal identifiers on request forms.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default-lane-id">Default Lane ID</Label>
            <Input
              id="default-lane-id"
              value={config.defaultLaneId}
              onChange={(event) => onFieldChange('defaultLaneId', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-terminal-id">Default Terminal ID</Label>
            <Input
              id="default-terminal-id"
              value={config.defaultTerminalId}
              onChange={(event) => onFieldChange('defaultTerminalId', event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Express Credentials</CardTitle>
          <CardDescription>Headers used to authenticate your merchant account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="acceptor">Acceptor ID</Label>
            <Input
              id="acceptor"
              value={config.expressAcceptorId}
              onChange={(event) => onFieldChange('expressAcceptorId', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-id">Account ID</Label>
            <Input
              id="account-id"
              value={config.expressAccountId}
              onChange={(event) => onFieldChange('expressAccountId', event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="account-token">Account Token</Label>
            <Input
              id="account-token"
              value={config.expressAccountToken}
              onChange={(event) => onFieldChange('expressAccountToken', event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Info</CardTitle>
          <CardDescription>Required application headers for all requests.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="app-id">Application ID</Label>
            <Input
              id="app-id"
              value={config.applicationId}
              onChange={(event) => onFieldChange('applicationId', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input
              id="app-name"
              value={config.applicationName}
              onChange={(event) => onFieldChange('applicationName', event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="app-version">Application Version</Label>
            <Input
              id="app-version"
              value={config.applicationVersion}
              onChange={(event) => onFieldChange('applicationVersion', event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Authorization Header</CardTitle>
          <CardDescription>Used only on transaction APIs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tp-auth">tp-authorization</Label>
            <Input
              id="tp-auth"
              value={config.tpAuthorization}
              onChange={(event) => onFieldChange('tpAuthorization', event.target.value)}
              placeholder="Version=1.0"
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
