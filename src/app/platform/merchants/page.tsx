import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MerchantsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
          <CardDescription>View Payrix Platform merchants.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Merchant list will be implemented in the next iteration.
            This is a placeholder page for the Foundation PR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
