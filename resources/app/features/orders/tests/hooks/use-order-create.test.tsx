import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { OrderCreateProvider } from '@/features/orders/contexts/order-create-context';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import type { ProductSelection } from '@/features/products';
import type { MoneyObject } from '@/schemas/shared/api';
import { server } from '@/tests/msw/server';

const money = (raw: number): MoneyObject => ({
  raw,
  display: `$${raw}`,
  currency: { code: 'USD', symbol: '$' },
});

const buildCalculationResponse = (itemsCount: number, overrides: Record<string, unknown> = {}) => ({
  is_tax_inclusive: false,
  totals: {
    base_items_subtotal_money_object: money(0),
    base_order_discount_money_object: money(0),
    base_order_total_money_object: money(0),
    base_tax_total_money_object: money(0),
    base_shipping_amount_money_object: money(0),
    base_shipping_strikethrough_money_object: money(0),
    base_total_money_object: money(0),
  },
  tax_lines: [],
  coupons: [],
  items_count: itemsCount,
  items: [
    {
      id: 0,
      quantity: 1,
      base_subtotal_money_object: money(0),
      base_unit_price_money_object: money(0),
      applied_product_coupons: [],
    },
  ],
  available_shipping_methods: [],
  shipping_method: null,
  ...overrides,
});

const mockCalculationResponse = (
  buildResponse: (requestBody: { items: unknown }) => Record<string, unknown>,
) => {
  let requestCount = 0;

  server.use(
    http.post(
      `${window.kirki_ecommerce.rest_url_base}${endpoints.CALCULATE_ORDER}`,
      async ({ request }) => {
        requestCount += 1;
        const body = (await request.json()) as { items: unknown };
        return HttpResponse.json({
          success: true,
          message: '',
          data: buildResponse(body),
        });
      },
    ),
  );

  return {
    getRequestCount: () => requestCount,
  };
};

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
      availableQuantity: 10,
      allowBackOrder: false,
      trackInventory: true,
      hasLimitPerOrder: false,
      maxPerOrder: null,
      regularPrice: money(10),
      salePrice: null,
    },
  ],
});

const buildCoupon = (code: string) => ({
  id: 1,
  method: 'code' as const,
  title: code,
  code,
  discount_type: 'amount-off' as const,
  status: 'active' as const,
});

const renderUseOrderCreate = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OrderCreateProvider>{children}</OrderCreateProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return renderHook(() => useOrderCreate(), { wrapper });
};

describe('useOrderCreate debounce -> payload -> query wiring', () => {
  it('does not fire the calculation query on mount', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    expect(result.current.rows).toEqual([]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(0);
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.calculation).toBeUndefined();
  });

  it('does not fire the calculation query when only the order notes change', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.form.setValue('order_notes', 'Leave at the front door', { shouldDirty: true });
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(0);
  });

  it('fires the calculation query when the form is reset', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.form.reset({ ...result.current.form.getValues(), customer_id: 7 });
    });

    await waitFor(() => expect(getRequestCount()).toBe(1), { timeout: 2000 });

    expect(result.current.form.getValues('customer_id')).toBe(7);
  });

  it('fires the calculation query when addresses are set in bulk', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.form.setValues(
        { shipping_country: 'US', shipping_city: 'Austin' },
        {
          shouldDirty: true,
        },
      );
    });

    await waitFor(() => expect(getRequestCount()).toBe(1), { timeout: 2000 });
  });

  it('fires one calculation query for a full address block set at once', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.form.setValues(
        {
          shipping_first_name: 'John',
          shipping_last_name: 'Doe',
          shipping_address_line1: '221B Baker Street',
          shipping_city: 'London',
          shipping_postal_code: 'NW1 6XE',
          shipping_country: 'GB',
        },
        { shouldDirty: true },
      );
    });

    await waitFor(() => expect(getRequestCount()).toBe(1), { timeout: 2000 });
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(1);
  });

  it('fires the calculation query for a change made after a reset', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.form.reset({ ...result.current.form.getValues(), customer_id: 7 });
    });

    act(() => {
      result.current.form.setValue('customer_id', 8);
    });

    await waitFor(() => expect(getRequestCount()).toBe(1), { timeout: 2000 });
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

    await waitFor(() => expect(requestedItems).toEqual([{ variant_id: 101, quantity: 1 }]), {
      timeout: 2000,
    });

    expect(result.current.calculation?.items_count).toBe(1);
  });
});

describe('useOrderCreate calculation reconciliation', () => {
  it('syncs a stock-clamped quantity back onto the form', async () => {
    mockCalculationResponse(() =>
      buildCalculationResponse(1, {
        items: [
          {
            id: 0,
            quantity: 1,
            base_subtotal_money_object: money(0),
            base_unit_price_money_object: money(0),
            applied_product_coupons: [],
          },
        ],
      }),
    );

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([productSelection()]);
    });

    act(() => {
      result.current.handleQuantityChange(0, 5);
    });

    expect(result.current.form.getValues('items.0.quantity')).toBe(5);

    await waitFor(() => expect(result.current.calculation).toBeDefined(), { timeout: 2000 });

    await waitFor(() => expect(result.current.form.getValues('items.0.quantity')).toBe(1), {
      timeout: 2000,
    });
  });

  it('removes a coupon code the calculation did not accept and surfaces it as rejected', async () => {
    mockCalculationResponse(() => buildCalculationResponse(1, { coupons: [] }));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([productSelection()]);
    });

    act(() => {
      result.current.form.setValue('coupon_codes', [buildCoupon('SUMMER')]);
    });

    await waitFor(() => expect(result.current.calculation).toBeDefined(), { timeout: 2000 });

    await waitFor(() => expect(result.current.rejectedCouponCodes).toEqual(['SUMMER']), {
      timeout: 2000,
    });

    expect(result.current.form.getValues('coupon_codes')).toEqual([]);
  });

  it('syncs a calculation-defaulted shipping method back onto the form', async () => {
    mockCalculationResponse(() => buildCalculationResponse(1, { shipping_method: 'express' }));

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([productSelection()]);
    });

    act(() => {
      result.current.form.setValue('shipping_method', 'flat_rate');
    });

    await waitFor(() => expect(result.current.calculation).toBeDefined(), { timeout: 2000 });

    await waitFor(() => expect(result.current.form.getValues('shipping_method')).toBe('express'), {
      timeout: 2000,
    });
  });

  it('does not fire a redundant calculation request solely from reconciling the form', async () => {
    const { getRequestCount } = mockCalculationResponse((body) => {
      const items = (body.items as { variant_id: number; quantity: number }[]) ?? [];

      return buildCalculationResponse(items.length, {
        items: items.map((_item, index) => ({
          id: index,
          quantity: 1,
          base_subtotal_money_object: money(0),
          base_unit_price_money_object: money(0),
          applied_product_coupons: [],
        })),
      });
    });

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([productSelection()]);
    });

    act(() => {
      result.current.handleQuantityChange(0, 5);
    });

    await waitFor(() => expect(result.current.calculation).toBeDefined(), { timeout: 2000 });
    await waitFor(() => expect(result.current.form.getValues('items.0.quantity')).toBe(1), {
      timeout: 2000,
    });

    // The settled count here isn't pinned to a fixed number - only that
    // no further request follows it.
    const settledRequestCount = getRequestCount();

    // Wait past both the debounce and the reconcile-guard window so a
    // redundant request, if one were going to fire, would have by now.
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(settledRequestCount);
  });

  it('still recalculates when the cart changes again right after a reconciling correction', async () => {
    const { getRequestCount } = mockCalculationResponse((body) => {
      const items = (body.items as { variant_id: number; quantity: number }[]) ?? [];

      return buildCalculationResponse(items.length, {
        items: items.map((item, index) => ({
          id: index,
          quantity: item.variant_id === 101 ? 1 : item.quantity,
          base_subtotal_money_object: money(0),
          base_unit_price_money_object: money(0),
          applied_product_coupons: [],
        })),
      });
    });

    const twoVariantSelection: ProductSelection = {
      ...productSelection(),
      variants: [
        ...productSelection().variants,
        {
          variantId: 102,
          variantLabel: 'Second',
          thumbnail: null,
          inStock: true,
          availableQuantity: 10,
          allowBackOrder: false,
          trackInventory: true,
          hasLimitPerOrder: false,
          maxPerOrder: null,
          regularPrice: money(10),
          salePrice: null,
        },
      ],
    };

    const { result } = renderUseOrderCreate();

    act(() => {
      result.current.handleAddItems([twoVariantSelection]);
    });

    act(() => {
      result.current.handleQuantityChange(0, 5);
    });

    await waitFor(() => expect(result.current.calculation).toBeDefined(), { timeout: 2000 });
    await waitFor(() => expect(result.current.form.getValues('items.0.quantity')).toBe(1), {
      timeout: 2000,
    });

    // The settled count here isn't pinned to a fixed number - only that
    // removing an item triggers exactly one more request.
    const settledRequestCount = getRequestCount();

    act(() => {
      result.current.handleRemoveItem(1);
    });

    await waitFor(() => expect(getRequestCount()).toBe(settledRequestCount + 1), {
      timeout: 2000,
    });
    await waitFor(() => expect(result.current.calculation?.items_count).toBe(1), {
      timeout: 2000,
    });
  });
});
