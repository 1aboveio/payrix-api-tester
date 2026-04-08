'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditPlanRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/platform/plans/${params.id}`);
  }, [params.id, router]);
  return null;
}
