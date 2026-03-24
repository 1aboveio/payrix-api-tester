'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { toast } from '@/lib/toast';
import type { PayrixConfig } from '@/lib/payrix/types';
import { PrinterSettingsCard } from '@/components/printer/printer-settings';

export default function SettingsPage() {
  const { config, hydrated, updateConfig, reset } = usePayrixConfig();
  const [saved, setSaved] = useState(false);
  const [wasReset, setWasReset] = useState(false);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  }

  const onFieldChange = (field: keyof PayrixConfig, value: string) => {
    updateConfig({ ...config, [field]: value });
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <Card data-testid="environment-card">
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>
            Switch between test and live using the toggle in the header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                config.globalEnvironment === 'live'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              }`}
            >
              {config.globalEnvironment === 'live' ? 'LIVE' : 'TEST'}
            </span>
            <span className="text-sm text-muted-foreground">
              TriPOS:{' '}
              <span className="font-mono text-xs">
                {config.environment === 'prod' ? 'prod (tripos.vantiv.com)' : 'cert (triposcert.vantiv.com)'}
              </span>{' '}
              · Platform:{' '}
              <span className="font-mono text-xs">
                {config.platformEnvironment === 'prod' ? 'prod (api.payrix.com)' : 'test (test-api.payrix.com)'}
              </span>
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
            <Input id="app-id" value={config.applicationId} onChange={(event) => onFieldChange('applicationId', event.target.value)} />
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

      <Card>
        <CardHeader>
          <CardTitle>Sunmi Data Cloud Credentials</CardTitle>
          <CardDescription>APP ID and APP Key for Sunmi Digital Store bind/unbind API. Overrides server env vars when set.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Platform API Credentials</CardTitle>
          <CardDescription>Credentials for Payrix Platform REST APIs (invoices, merchants, customers). Environment is controlled by the header toggle.</CardDescription>
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
        <Button
          onClick={() => {
            updateConfig(config);
            setSaved(true);
            setWasReset(false);
            toast.success('Settings saved');
          }}
        >
          Save Settings
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            reset();
            setSaved(false);
            setWasReset(true);
            toast.success('Settings reset to defaults');
          }}
        >
          Reset to Defaults
        </Button>
      </div>
      {saved && <p className="text-sm text-muted-foreground">Saved to localStorage.</p>}
      {wasReset && <p className="text-sm text-muted-foreground">Reset to default values.</p>}
    </div>
  );
}
