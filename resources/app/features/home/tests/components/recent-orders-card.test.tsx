import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import RecentOrdersCard from '@/features/home/components/recent-orders-card';
import { type OrderListItem, OrderListItemSchema } from '@/features/orders';

const money = (raw: number) => ({
  raw,
  display: `$${raw.toFixed(2)}`,
  currency: { code: 'USD', symbol: '$' },
});

const makeOrder = (overrides: Partial<Record<string, unknown>>): OrderListItem =>
  OrderListItemSchema.parse({
    id: 12,
    uuid: 'a1b2c3',
    order_number: '#1012',
    invoice_number: null,
    customer_id: null,
    customer_name: 'Ada Lovelace',
    customer_email: 'ada@example.com',
    is_manual: false,
    quantity: 2,
    invoiced_total: 25,
    invoiced_total_money_object: money(25),
    base_total: 25,
    base_total_money_object: money(25),
    status: 'pending',
    fulfillment_status: 'unfulfilled',
    is_refund_initiated: false,
    payment_status: 'unpaid',
    payment_provider: 'cash_on_delivery',
    payment_provider_name: 'Cash on Delivery',
    payment_provider_icon: null,
    payment_provider_is_offline: true,
    shipping_method: null,
    shipping_method_name: null,
    created_at: '2026-10-14 09:30:00',
    ...overrides,
  });

describe('RecentOrdersCard', () => {
  it('shows the fulfillment badge and the payment badge with its status variant', () => {
    render(
      <MemoryRouter>
        <RecentOrdersCard
          orders={[
            makeOrder({}),
            makeOrder({
              id: 13,
              order_number: '#1013',
              fulfillment_status: 'delivered',
              payment_status: 'failed',
            }),
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Unfulfilled')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByText('Unpaid')).toHaveAttribute('data-variant', 'warning');
    expect(screen.getByText('Delivered')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByText('Failed')).toHaveAttribute('data-variant', 'destructive');
  });
});
