'use client';

import { useState, useEffect } from 'react';

export function WebhookEndpointUrl() {
  const [endpointUrl, setEndpointUrl] = useState<string | null>(null);

  useEffect(() => {
    setEndpointUrl(`${window.location.origin}/api/webhooks/payrix`);
  }, []);

  if (!endpointUrl) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
        Loading...
      </code>
    );
  }

  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">
      {endpointUrl}
    </code>
  );
}
