import { redirect } from 'next/navigation';

export default function TokenCreatePage() {
  redirect('/platform/tokens/checkout');
}
