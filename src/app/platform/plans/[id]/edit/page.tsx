'use client';

import { useParams, redirect } from 'next/navigation';

export default function EditPlanRedirect() {
  const params = useParams();
  redirect(`/platform/plans/${params.id}`);
}
