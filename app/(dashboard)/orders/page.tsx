import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseJson } from '@/lib/json';
import { Card, CardContent } from '@/components/ui/card';
import { OrdersTable } from '@/components/Store/OrdersTable';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { store: { userId: user.id } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage fulfilment — update status and add tracking numbers.
        </p>
      </div>
      <Card>
        <CardContent className="p-4">
          <OrdersTable
            orders={orders.map((o) => ({
              id: o.id,
              customerEmail: o.customerEmail,
              totalAmount: o.totalAmount,
              status: o.status,
              trackingNumber: o.trackingNumber,
              itemsCount: parseJson<unknown[]>(o.items, []).length,
              createdAt: o.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
