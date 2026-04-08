'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createCustomerAction } from '@/actions/platform';
import type { CreateCustomerRequest } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

export default function CreateCustomerPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const [formData, setFormData] = useState<Partial<CreateCustomerRequest>>({
    login: '',
    merchant: '',
    first: '',
    last: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePlatform(config).platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    // Validation
    if (!formData.login || !formData.merchant) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const body: CreateCustomerRequest = {
        login: formData.login!,
        merchant: formData.merchant!,
        first: formData.first || undefined,
        last: formData.last || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address1: formData.address1 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip: formData.zip || undefined,
      };
      setRequestPreview(body);

      const result = await createCustomerAction({ config, requestId }, body);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Customer created successfully');
      router.push('/platform/customers');
    } catch (error) {
      toast.error('Failed to create customer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/customers">
            <ArrowLeft className="mr-2 size-4" />
            Back to Customers
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Customer</CardTitle>
            <CardDescription>Create a new Payrix Platform customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="login">Login ID *</Label>
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="Your login ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant ID *</Label>
                <Input
                  id="merchant"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="Merchant ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first">First Name</Label>
                <Input
                  id="first"
                  value={formData.first}
                  onChange={(e) => setFormData({ ...formData, first: e.target.value })}
                  placeholder="First name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last">Last Name</Label>
                <Input
                  id="last"
                  value={formData.last}
                  onChange={(e) => setFormData({ ...formData, last: e.target.value })}
                  placeholder="Last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="ZIP code"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Customer'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/platform/customers">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint="/customers"
        method="POST"
        requestPreview={requestPreview}
        result={result}
        loading={loading}
      />
    </div>
  );
}
