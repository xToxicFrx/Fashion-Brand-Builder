'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUSES } from '@/lib/validations';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface SerializedOrder {
  id: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  trackingNumber: string | null;
  itemsCount: number;
  createdAt: string;
}

function OrderRow({ order }: { order: SerializedOrder }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Order updated.');
      router.refresh();
    } else {
      toast.error('Failed to update order.');
    }
  }

  return (
    <tr className="border-b last:border-0 align-middle">
      <td className="py-3 pr-4">{order.customerEmail}</td>
      <td className="py-3 pr-4">{order.itemsCount}</td>
      <td className="py-3 pr-4">{formatCurrency(order.totalAmount)}</td>
      <td className="py-3 pr-4">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            patch({ status: value });
          }}
        >
          <SelectTrigger className="h-9 w-36 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-3 pr-4">
        <div className="flex gap-2">
          <Input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Tracking #"
            className="h-9 w-40"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => patch({ trackingNumber: tracking || null })}
          >
            Save
          </Button>
        </div>
      </td>
      <td className="py-3 text-muted-foreground">
        {formatDate(order.createdAt)}
      </td>
    </tr>
  );
}

export function OrdersTable({ orders }: { orders: SerializedOrder[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No orders yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Items</th>
            <th className="py-2 pr-4 font-medium">Total</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Tracking</th>
            <th className="py-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
