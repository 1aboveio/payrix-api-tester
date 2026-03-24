'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <div className="space-y-2">
            <Label htmlFor="platform-environment">Platform Environment</Label>
            <Select
              value={config.platformEnvironment}
              onValueChange={(value: 'test' | 'prod') => onFieldChange('platformEnvironment', value)}
            >
              <SelectTrigger id="platform-environment">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">test (test-api.payrix.com)</SelectItem>
                <SelectItem value="prod">prod (api.payrix.com)</SelectItem>
              </SelectContent>
            </Select>
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
