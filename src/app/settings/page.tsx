'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { PayrixConfig } from '@/lib/payrix/types';

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
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Select the Payrix endpoint environment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={config.environment} onValueChange={(value) => onFieldChange('environment', value)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cert">cert (triposcert.vantiv.com)</SelectItem>
              <SelectItem value="prod">prod (tripos.vantiv.com)</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="flex items-center gap-4">
        <Button
          onClick={() => {
            updateConfig(config);
            setSaved(true);
            setWasReset(false);
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
