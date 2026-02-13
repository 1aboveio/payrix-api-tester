'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EndpointInfoProps {
  method: string;
  endpoint: string;
  docsUrl: string;
}

export function EndpointInfo({ method, endpoint, docsUrl }: EndpointInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Endpoint Reference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium">{method.toUpperCase()}</span>{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">{endpoint}</code>
        </p>
        <p>
          <Link href={docsUrl} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
            View API documentation
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
