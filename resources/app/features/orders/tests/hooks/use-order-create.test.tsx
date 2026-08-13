import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import type { ProductSelection } from '@/features/products';
import type { MoneyObject } from '@/schemas/shared/api';
import { server } from '@/tests/msw/server';

const money = (raw: number): MoneyObject => ({
  raw,
  display: `$${raw}`,
  currency: { code: 'USD', symbol: '$' },
});

const amountPair = (key: string, raw = 0): Record<string, unknown> => ({
  [key]: raw,
  [`${key}_money_object`]: money(raw),
});

const PRICING_KEYS = [
  'base_subtotal', 'display_subtotal',
  'base_tax_total', 'display_tax_total',
  'base_discount_total', 'display_discount_total',
  'base_shipping_subtotal', 'display_shipping_subtotal',
  'base_shipping_tax', 'display_shipping_tax',
  'base_shipping_discount', 'display_shipping_discount',
  'base_shipping_total', 'display_shipping_total',
  'base_total', 'display_total',
];

const buildCalculationResponse = (itemsCount: number) => ({
  pricing: PRICING_KEYS.reduce(
    (acc, key) => ({ ...acc, ...amountPair(key) }),
    { discount_details: null },
  ),
  items_count: itemsCount,
  items: [
    {
      id: 1,
      quantity: 1,
      ...amountPair('base_subtotal'),
      ...amountPair('display_subtotal'),
      tax_rate: null,
      ...amountPair('base_tax_amount'),
      ...amountPair('display_tax_amount'),
      tax_breakdown: [],
      ...amountPair('base_discount_amount'),
      ...amountPair('display_discount_amount'),
      discount_details: null,
      ...amountPair('base_total'),
      ...amountPair('display_total'),
    },
  ],
  available_shipping_methods: [],
  shipping_method: null,
});

const productSelection = (): ProductSelection => ({
  productId: 1,
  productTitle: 'Product',
  thumbnail: null,
  inStock: true,
  regularPrice: money(10),
  salePrice: null,
  variants: [
    {
      variantId: 101,
      variantLabel: 'Default',
      thumbnail: null,
      inStock: true,
      regularPrice: money(10),
      salePrice: null,
    },
  ],
});

const renderUseOrderCreate = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return renderHook(() => useOrderCreate(), { wrapper });
};

describe('useOrderCreate debounce -> payload -> query wiring', () => {
  it('leaves the calculation query disabled while no items are picked', () => {
    const { result } = renderUseOrderCreate();

    expect(result.current.rows).toEqual([]);
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.calculation).toBeUndefined();
  });

  it('fires the calculation query, debounced, once an item is picked', async () => {
    let requestedItems: unknown;

    server.use(
      http.post(
        `${window.kirki_ecommerce.rest_url_base}${endpoints.CALCULATE_ORDER}`,
        async ({ request }) => {
          const body = (await request.json()) as { items: unknown };
          requestedItems = body.items;
          return HttpResponse.json({
            success: true,
            message: '',
            data: buildCalculationResponse(1),
          });
        },
      ),
    );

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([productSelection()]);
    });

    expect(result.current.rows).toHaveLength(1);

    await waitFor(() => expect(result.current.calculation).toBeDefined(), {
      timeout: 2000,
    });

    expect(result.current.calculation?.items_count).toBe(1);
    expect(requestedItems).toEqual([{ variant_id: 101, quantity: 1 }]);
  });
});
