'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrixConfig } from '@/lib/payrix/types';

interface TriposTabProps {
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
  const creds = config.tripos[env];
  return (
    <Card data-testid={`tripos-${env}-credentials`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{env === 'test' ? 'Test' : 'Live'} Credentials</CardTitle>
          {config.globalEnvironment === env && (
            <span className="inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900 dark:text-orange-200">
              Active
            </span>
          )}
        </div>
        <CardDescription>
          {env === 'test'
            ? 'Sandbox environment — triposcert.vantiv.com'
            : 'Production environment — tripos.vantiv.com'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-acceptor`}>Acceptor ID</Label>
            <Input
              id={`${prefix}-acceptor`}
              value={creds.expressAcceptorId}
              onChange={(e) => onFieldChange(`${prefix}.expressAcceptorId`, e.target.value)}
              placeholder="Acceptor ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-account-id`}>Account ID</Label>
            <Input
              id={`${prefix}-account-id`}
              value={creds.expressAccountId}
              onChange={(e) => onFieldChange(`${prefix}.expressAccountId`, e.target.value)}
              placeholder="Account ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-lane`}>Default Lane ID</Label>
            <Input
              id={`${prefix}-lane`}
              value={creds.defaultLaneId}
              onChange={(e) => onFieldChange(`${prefix}.defaultLaneId`, e.target.value)}
              placeholder="Lane ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-terminal`}>Default Terminal ID</Label>
            <Input
              id={`${prefix}-terminal`}
              value={creds.defaultTerminalId}
              onChange={(e) => onFieldChange(`${prefix}.defaultTerminalId`, e.target.value)}
              placeholder="Terminal ID"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-token`}>Account Token</Label>
          <Input
            id={`${prefix}-token`}
            value={creds.expressAccountToken}
            onChange={(e) => onFieldChange(`${prefix}.expressAccountToken`, e.target.value)}
            placeholder="Account Token"
          />
        </div>
      </CardContent>
    </Card>
  );
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

      <CredentialFields env="test" prefix="tripos.test" config={config} onFieldChange={onFieldChange} />
      <CredentialFields env="live" prefix="tripos.live" config={config} onFieldChange={onFieldChange} />

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
              onChange={(e) => onFieldChange('applicationId', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input
              id="app-name"
              value={config.applicationName}
              onChange={(e) => onFieldChange('applicationName', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="app-version">Application Version</Label>
            <Input
              id="app-version"
              value={config.applicationVersion}
              onChange={(e) => onFieldChange('applicationVersion', e.target.value)}
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
              onChange={(e) => onFieldChange('tpAuthorization', e.target.value)}
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
