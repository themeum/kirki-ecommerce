import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { OrderEditProvider } from '@/features/orders/contexts/order-edit-context';
import { useOrderEdit } from '@/features/orders/hooks/use-order-edit';
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
      is_reachable: true,
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

const renderUseOrderEdit = (orderId?: number) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OrderEditProvider orderId={orderId}>{children}</OrderEditProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return renderHook(() => useOrderEdit(), { wrapper });
};

describe('useOrderEdit debounce -> payload -> query wiring', () => {
  it('does not fire the calculation query on mount', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderEdit();

    expect(result.current.rows).toEqual([]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(0);
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.calculation).toBeUndefined();
  });

  it('does not fire the calculation query when only the order notes change', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderEdit();

    act(() => {
      result.current.form.setValue('order_notes', 'Leave at the front door', { shouldDirty: true });
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(getRequestCount()).toBe(0);
  });

  it('fires the calculation query when the form is reset', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderEdit();

    act(() => {
      result.current.form.reset({ ...result.current.form.getValues(), customer_id: 7 });
    });

    await waitFor(() => expect(getRequestCount()).toBe(1), { timeout: 2000 });

    expect(result.current.form.getValues('customer_id')).toBe(7);
  });

  it('fires the calculation query when addresses are set in bulk', async () => {
    const { getRequestCount } = mockCalculationResponse(() => buildCalculationResponse(0));

    const { result } = renderUseOrderEdit();

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

    const { result } = renderUseOrderEdit();

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

    const { result } = renderUseOrderEdit();

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

    const { result } = renderUseOrderEdit();

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

describe('useOrderEdit calculation reconciliation', () => {
  it('syncs a stock-clamped quantity back onto the form', async () => {
    mockCalculationResponse(() =>
      buildCalculationResponse(1, {
        items: [
          {
            is_reachable: true,
            quantity: 1,
            base_subtotal_money_object: money(0),
            base_unit_price_money_object: money(0),
            applied_product_coupons: [],
          },
        ],
      }),
    );

    const { result } = renderUseOrderEdit();

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

    const { result } = renderUseOrderEdit();

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

    const { result } = renderUseOrderEdit();

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
        items: items.map(() => ({
          is_reachable: true,
          quantity: 1,
          base_subtotal_money_object: money(0),
          base_unit_price_money_object: money(0),
          applied_product_coupons: [],
        })),
      });
    });

    const { result } = renderUseOrderEdit();

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
        items: items.map((item) => ({
          is_reachable: true,
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

    const { result } = renderUseOrderEdit();

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

const EDIT_ORDER_ID = 5;

const shippingMethod = (id: string, name: string) => ({
  id,
  name,
  type: 'flat_rate',
  base_cost_money_object: money(5),
});

const editAddress = {
  first_name: 'Jane',
  last_name: 'Doe',
  address_line1: '1 Main St',
  city: 'Austin',
  state: 'TX',
  country: 'US',
  postal_code: '78701',
};

const buildEditInfo = (itemOverrides: Record<string, unknown> = {}) => ({
  id: EDIT_ORDER_ID,
  customer: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
  status: 'pending',
  fulfillment_status: 'unfulfilled',
  is_refund_initiated: false,
  is_editable: true,
  is_manual: true,
  currency_code: 'USD',
  is_tax_inclusive: false,
  totals: Object.fromEntries(
    [
      'items_subtotal',
      'order_discount',
      'order_total',
      'tax_total',
      'shipping_amount',
      'shipping_strikethrough',
      'total',
    ].flatMap((key) => [
      [`invoiced_${key}_money_object`, money(0)],
      [`base_${key}_money_object`, money(0)],
    ]),
  ),
  items_count: 1,
  items: [
    {
      id: 35,
      product_id: 4,
      variant_id: 12,
      product_name: 'Shirt',
      variant_name: 'Red',
      quantity: 2,
      invoiced_subtotal_money_object: money(20),
      base_subtotal_money_object: money(20),
      invoiced_unit_price_money_object: money(10),
      base_unit_price_money_object: money(10),
      invoiced_tax_total_money_object: money(0),
      base_tax_total_money_object: money(0),
      is_reachable: true,
      allow_back_order: false,
      track_inventory: true,
      available_quantity: 6,
      in_stock: true,
      has_limit_per_order: true,
      max_per_order: 3,
      ...itemOverrides,
    },
  ],
  shipping_address: editAddress,
  billing_address: editAddress,
  payment_provider: null,
  payment_status: 'unpaid',
  shipping_method: 'flat-1',
  shipping_tracking: {},
  created_at: '2026-01-07 17:19:56',
  available_shipping_methods: [shippingMethod('flat-1', 'Standard')],
});

const mockEditRead = (respond: () => Response) => {
  let requestCount = 0;

  server.use(
    http.get(
      `${window.kirki_ecommerce.rest_url_base}${endpoints.ORDER_EDIT(EDIT_ORDER_ID)}`,
      () => {
        requestCount += 1;
        return respond();
      },
    ),
  );

  return { getRequestCount: () => requestCount };
};

const editReadResponse = (data: unknown) => () =>
  HttpResponse.json({ success: true, message: '', data });

describe('useOrderEdit reading the order edit endpoint', () => {
  it('fills the form, the line limits and the shipping choices before any price preview', async () => {
    mockEditRead(editReadResponse(buildEditInfo()));

    const { result } = renderUseOrderEdit(EDIT_ORDER_ID);

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    expect(result.current.calculation).toBeUndefined();
    expect(result.current.rows[0].display).toMatchObject({
      availableQuantity: 6,
      allowBackOrder: false,
      trackInventory: true,
      hasLimitPerOrder: true,
      maxPerOrder: 3,
      isReachable: true,
      storedQuantity: 2,
    });
    expect(result.current.availableShippingMethods.map((method) => method.name)).toEqual([
      'Standard',
    ]);
  });

  it('marks a line whose variant was deleted as unreachable without stock data', async () => {
    mockEditRead(
      editReadResponse(
        buildEditInfo({
          is_reachable: false,
          allow_back_order: null,
          track_inventory: null,
          available_quantity: null,
          in_stock: null,
          has_limit_per_order: null,
          max_per_order: null,
        }),
      ),
    );

    const { result } = renderUseOrderEdit(EDIT_ORDER_ID);

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    expect(result.current.rows[0].display).toMatchObject({
      isReachable: false,
      trackInventory: false,
      allowBackOrder: true,
    });
  });

  it('replaces the shipping choices with the list of the next price preview', async () => {
    mockEditRead(editReadResponse(buildEditInfo()));
    mockCalculationResponse(() =>
      buildCalculationResponse(1, {
        items: [
          {
            id: 35,
            is_reachable: true,
            quantity: 3,
            base_subtotal_money_object: money(30),
            base_unit_price_money_object: money(10),
            applied_product_coupons: [],
          },
        ],
        available_shipping_methods: [shippingMethod('express-9', 'Express')],
        shipping_method: 'express-9',
      }),
    );

    const { result } = renderUseOrderEdit(EDIT_ORDER_ID);

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    act(() => {
      result.current.handleQuantityChange(0, 3);
    });

    await waitFor(
      () =>
        expect(result.current.availableShippingMethods.map((method) => method.name)).toEqual([
          'Express',
        ]),
      { timeout: 3000 },
    );
  });

  it('exposes a 422 refusal once, without retrying', async () => {
    const edit = mockEditRead(() =>
      HttpResponse.json(
        { success: false, message: 'This order can no longer be edited.', errors: {} },
        { status: 422 },
      ),
    );

    const { result } = renderUseOrderEdit(EDIT_ORDER_ID);

    await waitFor(() => expect(result.current.isOrderError).toBe(true));

    expect(result.current.orderError?.response?.status).toBe(422);
    expect(result.current.orderError?.message).toBe('This order can no longer be edited.');
    expect(result.current.order).toBeUndefined();
    expect(edit.getRequestCount()).toBe(1);
  });

  it('exposes a 404 answer as an error', async () => {
    mockEditRead(() =>
      HttpResponse.json({ success: false, message: 'Not found.', errors: {} }, { status: 404 }),
    );

    const { result } = renderUseOrderEdit(EDIT_ORDER_ID);

    await waitFor(() => expect(result.current.isOrderError).toBe(true));

    expect(result.current.orderError?.response?.status).toBe(404);
  });

  it('sends no edit read and starts with no shipping choices on the create screen', async () => {
    const edit = mockEditRead(editReadResponse(buildEditInfo()));

    const { result } = renderUseOrderEdit();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(edit.getRequestCount()).toBe(0);
    expect(result.current.availableShippingMethods).toEqual([]);
  });
});
