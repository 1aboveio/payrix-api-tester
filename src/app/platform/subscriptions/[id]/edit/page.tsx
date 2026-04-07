'use client';

import { useParams, redirect } from 'next/navigation';

export default function EditSubscriptionRedirect() {
  const params = useParams();
  redirect(`/platform/subscriptions/${params.id}`);
}
