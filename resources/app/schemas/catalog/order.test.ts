import { describe, expect, it } from 'vitest';

import {
  FulfillmentStatusSchema,
  OrderCalculationSchema,
  OrderItemSchema,
  OrderListItemSchema,
  OrderStatusSchema,
  OrderTrackingSchema,
  PaymentStatusSchema,
  RefundSchema,
  RefundStatusSchema,
  RefundTypeSchema,
  ShippingTypeSchema,
} from '@/schemas/catalog/order';

const invoicedMoney = (raw: number) => ({
  raw,
  display: `৳${raw.toFixed(2)}`,
  currency: { code: 'BDT', symbol: '৳' },
});

const baseMoney = (raw: number) => ({
  raw,
  display: `$${raw.toFixed(2)}`,
  currency: { code: 'USD', symbol: '$' },
});

describe('OrderStatusSchema', () => {
  it('accepts every status defined by OrderStatus.php', () => {
    const statuses = [
      'pending',
      'unpaid_processing',
      'paid_unfulfilled',
      'paid_processing',
      'paid_shipped',
      'shipped_unpaid',
      'delivered_unpaid',
      'completed',
      'on_hold_paid',
      'on_hold_unpaid',
      'paid_cancelled',
      'unpaid_cancelled',
      'failed_cancelled',
      'failed_unfulfilled',
      'failed_processing',
      'failed_shipped',
      'failed_delivered',
      'failed_on_hold',
      'refund_requested',
      'refund_in_progress',
      'refunded',
      'refund_declined',
      'returned_pending_refund',
      'refunded_partially',
    ];

    expect(statuses).toHaveLength(24);
    statuses.forEach((status) => {
      expect(OrderStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it('rejects a status outside the state machine', () => {
    expect(OrderStatusSchema.safeParse('archived').success).toBe(false);
  });
});

describe('PaymentStatusSchema', () => {
  it('accepts every status defined by PaymentStatus.php', () => {
    ['paid', 'unpaid', 'failed', 'refunding', 'refunded'].forEach((status) => {
      expect(PaymentStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it('rejects "pending", the payment_status column default that PaymentStatus.php never defines', () => {
    expect(PaymentStatusSchema.safeParse('pending').success).toBe(false);
  });
});

describe('FulfillmentStatusSchema', () => {
  it('accepts every status defined by FulfillmentStatus.php', () => {
    ['unfulfilled', 'processing', 'shipped', 'delivered', 'on-hold', 'cancelled', 'returned'].forEach((status) => {
      expect(FulfillmentStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it('rejects an underscored on_hold, since the constant is hyphenated', () => {
    expect(FulfillmentStatusSchema.safeParse('on_hold').success).toBe(false);
  });
});

describe('ShippingTypeSchema', () => {
  it('accepts the method types the shipping settings can produce', () => {
    ['flat_rate', 'local_pickup', 'weight'].forEach((type) => {
      expect(ShippingTypeSchema.safeParse(type).success).toBe(true);
    });
  });
});

describe('OrderTrackingSchema', () => {
  it('accepts a fully populated tracking block', () => {
    const result = OrderTrackingSchema.safeParse({
      carrier: 'DHL',
      tracking_number: 'DH123456789BD',
      tracking_url: 'https://dhl.com/track/DH123456789BD',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an untracked order, whose tracking columns are all null', () => {
    const result = OrderTrackingSchema.safeParse({
      carrier: null,
      tracking_number: null,
      tracking_url: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts the tracking keys being absent entirely', () => {
    expect(OrderTrackingSchema.safeParse({}).success).toBe(true);
  });
});

describe('RefundStatusSchema', () => {
  it('accepts every status defined by RefundStatus.php', () => {
    ['pending', 'completed', 'cancelled'].forEach((status) => {
      expect(RefundStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it('rejects "failed", which the refunds table enum allows but RefundStatus.php omits', () => {
    expect(RefundStatusSchema.safeParse('failed').success).toBe(false);
  });
});

describe('RefundTypeSchema', () => {
  it('accepts every type defined by RefundType.php', () => {
    ['full', 'partial'].forEach((type) => {
      expect(RefundTypeSchema.safeParse(type).success).toBe(true);
    });
  });
});

describe('RefundSchema', () => {
  const documentedRefund = {
    id: 3,
    invoiced_amount: 12,
    invoiced_amount_money_object: invoicedMoney(12),
    type: 'partial',
    reason: 'Damaged on arrival',
    transaction_id: 're_3QxYzA2eZvKYlo2C0abcdefg',
    status: 'completed',
    created_at: '2026-02-02 05:36:34',
    created_by: 1,
  };

  it('accepts the refund shape emitted by OrderResource', () => {
    expect(RefundSchema.safeParse(documentedRefund).success).toBe(true);
  });

  it('accepts a freshly requested refund with no reason, gateway id or author', () => {
    const result = RefundSchema.safeParse({
      ...documentedRefund,
      reason: null,
      transaction_id: null,
      created_by: null,
      status: 'pending',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a refund with no type, since full and partial are settled at creation', () => {
    const { type, ...withoutType } = documentedRefund;
    expect(type).toBe('partial');
    expect(RefundSchema.safeParse(withoutType).success).toBe(false);
  });
});

describe('OrderItemSchema', () => {
  const documentedOrder = {
    id: 29,
    uuid: 'd9249ee1-b100-4f2e-b34b-a5caf2ef9725',
    order_number: 'ORD-695CEA20C3A9D',
    customer_id: 2,
    status: 'pending',
    fulfillment_status: 'unfulfilled',
    is_refund_initiated: false,
    is_manual: false,
    currency_code: 'BDT',
    totals: {
      invoiced_subtotal: 2654.34,
      invoiced_subtotal_money_object: invoicedMoney(2654.34),
      base_subtotal: 31.6,
      base_subtotal_money_object: baseMoney(31.6),
      invoiced_shipping: 5312,
      invoiced_shipping_money_object: invoicedMoney(5312),
      base_shipping: 64,
      base_shipping_money_object: baseMoney(64),
      invoiced_discount: 531.2,
      invoiced_discount_money_object: invoicedMoney(531.2),
      base_discount: 6.32,
      base_discount_money_object: baseMoney(6.32),
      discount_details: { id: 6, code: 'WINTER20', title: 'Winter Sale' },
      invoiced_tax: 0,
      invoiced_tax_money_object: invoicedMoney(0),
      base_tax: 0,
      base_tax_money_object: baseMoney(0),
      invoiced_total: 7435.14,
      invoiced_total_money_object: invoicedMoney(7435.14),
      base_total: 89.28,
      base_total_money_object: baseMoney(89.28),
    },
    items_count: 2,
    items: [
      {
        id: 35,
        product_id: 4,
        variant_id: 12,
        product_name: 'Classic Cotton T-Shirt',
        variant_name: 'Red, Red',
        quantity: 2,
        invoiced_price: 1327.17,
        invoiced_price_money_object: invoicedMoney(1327.17),
        base_price: 15.8,
        base_price_money_object: baseMoney(15.8),
        invoiced_subtotal: 2654.34,
        invoiced_subtotal_money_object: invoicedMoney(2654.34),
        base_subtotal: 31.6,
        base_subtotal_money_object: baseMoney(31.6),
        invoiced_discount_amount: 531.2,
        invoiced_discount_amount_money_object: invoicedMoney(531.2),
        base_discount_amount: 6.32,
        base_discount_amount_money_object: baseMoney(6.32),
        invoiced_total: 2123.14,
        invoiced_total_money_object: invoicedMoney(2123.14),
        base_total: 25.28,
        base_total_money_object: baseMoney(25.28),
        tax_rate: 0,
        invoiced_tax_total: 0,
        invoiced_tax_total_money_object: invoicedMoney(0),
        base_tax_total: 0,
        base_tax_total_money_object: baseMoney(0),
        tax_breakdown: [],
        sku: 'T-SHIRT-1-4',
        image: null,
      },
    ],
    shipping_address: {
      first_name: 'Sunny',
      last_name: 'Doe',
      address_line1: 'Nikunja 2, Khilket',
      address_line2: '',
      city: 'Dhaka',
      state: '5665',
      country: 'BD',
      postal_code: '5665',
      phone: '+1 555-000-2000',
      email: 'jane.shipping@example.com',
    },
    is_billing_same_as_shipping: false,
    billing_address: {
      first_name: 'Jane',
      last_name: 'Doe',
      address_line1: '78 Sunset Blvd',
      address_line2: '',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      postal_code: '90001',
      phone: '+1 555-000-2000',
      email: 'jane.shipping@example.com',
    },
    payment_provider: 'stripe',
    payment_status: 'unpaid',
    shipping_method: 'fsdfdsfsdfsdf343432jh4',
    shipping_method_name: 'Standard Delivery',
    customer_notes: null,
    admin_notes: null,
    flags: [],
    shipping_tracking: {
      carrier: null,
      tracking_number: null,
      tracking_url: null,
    },
    refunds: [],
    archived_at: null,
    created_at: '2026-01-07 17:19:56',
  };

  it('accepts the order shape emitted by OrderResource', () => {
    expect(OrderItemSchema.safeParse(documentedOrder).success).toBe(true);
  });

  it('accepts an unrecognized extra field on the order and on a nested item', () => {
    const result = OrderItemSchema.safeParse({
      ...documentedOrder,
      unexpected: 'value',
      items: [{ ...documentedOrder.items[0], unexpected: 'value' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts the nullable columns coming back null (uuid, order_number, customer_id, payment_provider)', () => {
    const result = OrderItemSchema.safeParse({
      ...documentedOrder,
      uuid: null,
      order_number: null,
      customer_id: null,
      payment_provider: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an order with no coupon, notes, flags, refunds or shipping method', () => {
    const result = OrderItemSchema.safeParse({
      ...documentedOrder,
      totals: { ...documentedOrder.totals, discount_details: null },
      shipping_method: null,
      shipping_method_name: null,
      flags: null,
      refunds: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a persisted tax breakdown, whose base_amount is raw minor units', () => {
    const result = OrderItemSchema.safeParse({
      ...documentedOrder,
      items: [
        {
          ...documentedOrder.items[0],
          tax_rate: 7.5,
          tax_breakdown: [{ name: 'Tax', rate: 7.5, base_amount: 237 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an item image resolved to a media attachment', () => {
    const result = OrderItemSchema.safeParse({
      ...documentedOrder,
      items: [
        {
          ...documentedOrder.items[0],
          image: { id: 42, url: 'https://example.com/shirt.png' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('keeps is_manual required, so pickFormValues reads the order instead of defaulting to true', () => {
    const { is_manual, ...withoutIsManual } = documentedOrder;
    expect(is_manual).toBe(false);
    expect(OrderItemSchema.safeParse(withoutIsManual).success).toBe(false);
  });

  it('rejects a status outside the state machine', () => {
    const result = OrderItemSchema.safeParse({ ...documentedOrder, status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('rejects an order with no totals block', () => {
    const { totals, ...withoutTotals } = documentedOrder;
    expect(totals.base_total).toBe(89.28);
    expect(OrderItemSchema.safeParse(withoutTotals).success).toBe(false);
  });
});

describe('OrderListItemSchema', () => {
  const documentedListItem = {
    id: 37,
    uuid: '606520b3-fa5b-4612-8257-0c59c0e577b4',
    order_number: 'ORD-695F527B85572',
    customer_id: 2,
    quantity: 4,
    invoiced_total: 115.17,
    invoiced_total_money_object: baseMoney(115.17),
    base_total: 115.17,
    base_total_money_object: baseMoney(115.17),
    status: 'pending',
    fulfillment_status: 'unfulfilled',
    is_refund_initiated: false,
    payment_status: 'unpaid',
    payment_provider: 'stripe',
    created_at: '2026-01-08 06:45:15',
  };

  it('accepts the row shape emitted by OrderListResource', () => {
    expect(OrderListItemSchema.safeParse(documentedListItem).success).toBe(true);
  });

  it('accepts an older row whose uuid and customer_id were never set', () => {
    const result = OrderListItemSchema.safeParse({
      ...documentedListItem,
      uuid: null,
      customer_id: null,
      payment_provider: null,
    });
    expect(result.success).toBe(true);
  });

  it('does not require the detail-only totals and items the list endpoint omits', () => {
    expect(documentedListItem).not.toHaveProperty('totals');
    expect(documentedListItem).not.toHaveProperty('items');
    expect(OrderListItemSchema.safeParse(documentedListItem).success).toBe(true);
  });
});

describe('OrderCalculationSchema', () => {
  const displayMoney = invoicedMoney;

  const documentedCalculation = {
    pricing: {
      base_subtotal: 5308.68,
      base_subtotal_money_object: displayMoney(5308.68),
      display_subtotal: 5308.68,
      display_subtotal_money_object: displayMoney(5308.68),
      base_tax_total: 0,
      base_tax_total_money_object: displayMoney(0),
      display_tax_total: 0,
      display_tax_total_money_object: displayMoney(0),
      discount_details: { id: 6, code: 'WINTER20' },
      base_discount_total: 12.79,
      base_discount_total_money_object: displayMoney(12.79),
      display_discount_total: 12.79,
      display_discount_total_money_object: displayMoney(12.79),
      base_shipping_subtotal: 5312,
      base_shipping_subtotal_money_object: displayMoney(5312),
      display_shipping_subtotal: 5312,
      display_shipping_subtotal_money_object: displayMoney(5312),
      base_shipping_tax: 0,
      base_shipping_tax_money_object: displayMoney(0),
      display_shipping_tax: 0,
      display_shipping_tax_money_object: displayMoney(0),
      base_shipping_discount: 0,
      base_shipping_discount_money_object: displayMoney(0),
      display_shipping_discount: 0,
      display_shipping_discount_money_object: displayMoney(0),
      base_shipping_total: 5312,
      base_shipping_total_money_object: displayMoney(5312),
      display_shipping_total: 5312,
      display_shipping_total_money_object: displayMoney(5312),
      base_total: 9559.11,
      base_total_money_object: displayMoney(9559.11),
      display_total: 9559.11,
      display_total_money_object: displayMoney(9559.11),
    },
    items_count: 4,
    items: [
      {
        id: 1,
        quantity: 4,
        base_subtotal: 5308.68,
        base_subtotal_money_object: displayMoney(5308.68),
        display_subtotal: 5308.68,
        display_subtotal_money_object: displayMoney(5308.68),
        tax_rate: 0,
        base_tax_amount: 0,
        base_tax_amount_money_object: displayMoney(0),
        display_tax_amount: 0,
        display_tax_amount_money_object: displayMoney(0),
        tax_breakdown: [],
        base_discount_amount: 12.79,
        base_discount_amount_money_object: displayMoney(12.79),
        display_discount_amount: 12.79,
        display_discount_amount_money_object: displayMoney(12.79),
        base_total: 4247.11,
        base_total_money_object: displayMoney(4247.11),
        display_total: 4247.11,
        display_total_money_object: displayMoney(4247.11),
      },
    ],
    available_shipping_methods: [
      {
        id: 'fsdfdsfsdfsdf343432jh4',
        name: 'Standard Delivery',
        type: 'flat_rate',
        base_cost: 5312,
        base_cost_money_object: displayMoney(5312),
        display_cost: 5312,
        display_cost_money_object: displayMoney(5312),
      },
    ],
    shipping_method: 'fsdfdsfsdfsdf343432jh4',
  };

  it('accepts the documented calculation (orders/Calculate Order Totals.yml)', () => {
    expect(OrderCalculationSchema.safeParse(documentedCalculation).success).toBe(true);
  });

  it('accepts a numeric shipping method id, which the settings may store either way', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      available_shipping_methods: [
        { ...documentedCalculation.available_shipping_methods[0], id: 4 },
      ],
      shipping_method: 4,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a destination with no shipping method chosen or available', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      available_shipping_methods: [],
      shipping_method: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a calculation with no coupon applied', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      pricing: { ...documentedCalculation.pricing, discount_details: null },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a per-item tax breakdown carrying both base and display amounts', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      items: [
        {
          ...documentedCalculation.items[0],
          tax_rate: 7.5,
          tax_breakdown: [
            {
              name: 'VAT',
              rate: 7.5,
              base_amount: 398.15,
              base_amount_money_object: displayMoney(398.15),
              display_amount: 398.15,
              display_amount_money_object: displayMoney(398.15),
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
