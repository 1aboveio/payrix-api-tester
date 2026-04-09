'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditSubscriptionRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/platform/subscriptions/${params.id}`);
  }, [params.id, router]);
  return null;
}
