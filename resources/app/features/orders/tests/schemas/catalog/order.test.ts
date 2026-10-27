import { assert, describe, expect, it } from 'vitest';

import {
  FulfillmentStatusSchema,
  OrderCalculationSchema,
  OrderListItemSchema,
  OrderSchema,
  OrderStatusSchema,
  OrderTrackingSchema,
  PaymentStatusSchema,
  RefundSchema,
  RefundStatusSchema,
  RefundTypeSchema,
  ShippingTypeSchema,
} from '@/features/orders/schemas/catalog/order';

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
    invoiced_amount_money_object: invoicedMoney(12),
    type: 'partial',
    reason: 'Damaged on arrival',
    transaction_id: 're_3QxYzA2eZvKYlo2C0abcdefg',
    status: 'completed',
    created_at: '2026-02-02 05:36:34',
    created_by: 1,
  };

  it('accepts the refund shape emitted by OrderResource, which carries only an invoiced-currency money object', () => {
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

const documentedAddress = {
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
};

const documentedCoupon = {
  id: 6,
  coupon_id: 6,
  code: 'WINTER20',
  title: 'Winter Sale',
  discount_type: 'amount-off',
  discount_target: 'order',
  invoiced_discount_amount_money_object: invoicedMoney(531.2),
  base_discount_amount_money_object: baseMoney(6.32),
  usage_reversed_at: null,
  discount_value_type: 'percentage',
  discount_amount_percentage: 20,
  invoiced_discount_amount_fixed_money_object: null,
  base_discount_amount_fixed_money_object: null,
};

const documentedTaxLine = {
  name: 'VAT',
  rate: 7.5,
  invoiced_amount_money_object: invoicedMoney(19.9),
  base_amount_money_object: baseMoney(237),
};

const documentedLineItem = {
  id: 35,
  product_id: 4,
  variant_id: 12,
  product_name: 'Classic Cotton T-Shirt',
  variant_name: 'Red, Red',
  sku: 'T-SHIRT-1-4',
  image: null,
  quantity: 2,
  invoiced_subtotal_money_object: invoicedMoney(2654.34),
  base_subtotal_money_object: baseMoney(31.6),
  invoiced_strikethrough_price_money_object: null,
  base_strikethrough_price_money_object: null,
  invoiced_unit_price_money_object: invoicedMoney(1327.17),
  base_unit_price_money_object: baseMoney(15.8),
  invoiced_unit_strikethrough_price_money_object: null,
  base_unit_strikethrough_price_money_object: null,
  invoiced_tax_total_money_object: invoicedMoney(0),
  base_tax_total_money_object: baseMoney(0),
  tax_lines: [],
  applied_product_coupons: [],
};

describe('OrderSchema', () => {
  const documentedOrder = {
    id: 29,
    uuid: 'd9249ee1-b100-4f2e-b34b-a5caf2ef9725',
    order_number: 'ORD-695CEA20C3A9D',
    invoice_number: 'INV-695CEA20C3A9D',
    customer_id: 2,
    customer: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '+1 555-000-2000',
    },
    status: 'pending',
    fulfillment_status: 'unfulfilled',
    is_refund_initiated: false,
    is_manual: false,
    currency_code: 'BDT',
    is_tax_inclusive: false,
    totals: {
      invoiced_items_subtotal_money_object: invoicedMoney(2654.34),
      base_items_subtotal_money_object: baseMoney(31.6),
      invoiced_order_discount_money_object: invoicedMoney(531.2),
      base_order_discount_money_object: baseMoney(6.32),
      invoiced_order_total_money_object: invoicedMoney(2123.14),
      base_order_total_money_object: baseMoney(25.28),
      invoiced_tax_total_money_object: invoicedMoney(0),
      base_tax_total_money_object: baseMoney(0),
      invoiced_shipping_amount_money_object: invoicedMoney(5312),
      base_shipping_amount_money_object: baseMoney(64),
      invoiced_shipping_strikethrough_money_object: invoicedMoney(5312),
      base_shipping_strikethrough_money_object: baseMoney(64),
      invoiced_total_money_object: invoicedMoney(7435.14),
      base_total_money_object: baseMoney(89.28),
    },
    tax_lines: [],
    coupons: [documentedCoupon],
    items_count: 2,
    items: [documentedLineItem],
    shipping_address: documentedAddress,
    is_billing_same_as_shipping: false,
    billing_address: {
      ...documentedAddress,
      first_name: 'Jane',
      address_line1: '78 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      postal_code: '90001',
    },
    payment_provider: 'stripe',
    payment_provider_name: 'Stripe',
    payment_provider_icon: 'https://example.com/stripe.png',
    payment_provider_is_offline: false,
    payment_status: 'unpaid',
    shipping_method: 'fsdfdsfsdfsdf343432jh4',
    shipping_method_name: 'Standard Delivery',
    shipping_method_type: 'flat_rate',
    order_notes: null,
    flags: [],
    shipping_tracking: {
      carrier: null,
      tracking_number: null,
      tracking_url: null,
    },
    refunds: [],
    estimated_delivery_date: null,
    archived_at: null,
    created_at: '2026-01-07 17:19:56',
    cancelled_at: null,
    paid_at: null,
    shipped_at: null,
    fulfilled_at: null,
  };

  it('accepts the order shape emitted by OrderResource', () => {
    expect(OrderSchema.safeParse(documentedOrder).success).toBe(true);
  });

  it('keeps order_notes on the parsed order and has no customer_notes or admin_notes field', () => {
    const result = OrderSchema.parse({ ...documentedOrder, order_notes: 'Leave at the door' });

    expect(result.order_notes).toBe('Leave at the door');
    expect(Object.keys(result)).not.toContain('customer_notes');
    expect(Object.keys(result)).not.toContain('admin_notes');
  });

  it('accepts an unrecognized extra field on the order and on a nested item', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      unexpected: 'value',
      items: [{ ...documentedOrder.items[0], unexpected: 'value' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts the nullable columns coming back null (uuid, order_number, customer_id, payment_provider)', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      uuid: null,
      order_number: null,
      customer_id: null,
      payment_provider: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an order with no coupons, notes, flags, refunds or shipping method', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      coupons: [],
      shipping_method: null,
      shipping_method_name: null,
      flags: null,
      refunds: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a persisted set of tax lines, each with its own invoiced and base money objects', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      items: [{ ...documentedOrder.items[0], tax_lines: [documentedTaxLine] }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an item with a strikethrough price and applied product coupons', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      items: [
        {
          ...documentedOrder.items[0],
          base_strikethrough_price_money_object: baseMoney(40),
          invoiced_strikethrough_price_money_object: invoicedMoney(3400),
          base_unit_strikethrough_price_money_object: baseMoney(20),
          invoiced_unit_strikethrough_price_money_object: invoicedMoney(1700),
          applied_product_coupons: [
            {
              code: 'PRODCOUPON',
              title: 'Product coupon',
              invoiced_discount_amount_money_object: invoicedMoney(100),
              base_discount_amount_money_object: baseMoney(1.2),
              discount_value_type: 'fixed',
              discount_amount_percentage: null,
              invoiced_discount_amount_fixed_money_object: invoicedMoney(100),
              base_discount_amount_fixed_money_object: baseMoney(1.2),
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an item image resolved to a media attachment', () => {
    const result = OrderSchema.safeParse({
      ...documentedOrder,
      items: [{ ...documentedOrder.items[0], image: { id: 42, url: 'https://example.com/shirt.png' } }],
    });
    expect(result.success).toBe(true);
  });

  it('keeps is_manual required, so pickFormValues reads the order instead of defaulting to true', () => {
    const { is_manual, ...withoutIsManual } = documentedOrder;
    expect(is_manual).toBe(false);
    expect(OrderSchema.safeParse(withoutIsManual).success).toBe(false);
  });

  it('rejects a status outside the state machine', () => {
    const result = OrderSchema.safeParse({ ...documentedOrder, status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('rejects an order with no totals block', () => {
    const { totals, ...withoutTotals } = documentedOrder;
    expect(totals.base_total_money_object.raw).toBe(89.28);
    expect(OrderSchema.safeParse(withoutTotals).success).toBe(false);
  });
});

describe('OrderListItemSchema', () => {
  const documentedListItem = {
    id: 37,
    uuid: '606520b3-fa5b-4612-8257-0c59c0e577b4',
    order_number: 'ORD-695F527B85572',
    customer_id: 2,
    customer_name: 'Melanie Martinez',
    customer_email: 'melanie@example.com',
    is_manual: false,
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

  it('accepts a row with no shipping name, which OrderListResource resolves to a null customer_name', () => {
    const result = OrderListItemSchema.safeParse({
      ...documentedListItem,
      customer_name: null,
      customer_email: null,
    });
    expect(result.success).toBe(true);
  });

  it('keeps is_manual required, so the Manual Order badge reads the row instead of defaulting', () => {
    const { is_manual, ...withoutIsManual } = documentedListItem;
    expect(is_manual).toBe(false);
    expect(OrderListItemSchema.safeParse(withoutIsManual).success).toBe(false);
  });

  it('does not require the detail-only totals and items the list endpoint omits', () => {
    expect(documentedListItem).not.toHaveProperty('totals');
    expect(documentedListItem).not.toHaveProperty('items');
    expect(OrderListItemSchema.safeParse(documentedListItem).success).toBe(true);
  });
});

describe('OrderCalculationSchema', () => {
  const documentedCalculation = {
    is_tax_inclusive: false,
    totals: {
      base_items_subtotal_money_object: baseMoney(5308.68),
      base_order_discount_money_object: baseMoney(12.79),
      base_order_total_money_object: baseMoney(4247.11),
      base_tax_total_money_object: baseMoney(0),
      base_shipping_amount_money_object: baseMoney(5312),
      base_shipping_strikethrough_money_object: baseMoney(5312),
      base_total_money_object: baseMoney(9559.11),
    },
    tax_lines: [],
    coupons: [],
    items_count: 4,
    items: [
      {
        id: 0,
        quantity: 4,
        base_subtotal_money_object: baseMoney(5308.68),
        base_strikethrough_price_money_object: null,
        base_unit_price_money_object: baseMoney(1327.17),
        base_unit_strikethrough_price_money_object: null,
        applied_product_coupons: [],
      },
    ],
    available_shipping_methods: [
      {
        id: 'fsdfdsfsdfsdf343432jh4',
        name: 'Standard Delivery',
        type: 'flat_rate',
        base_cost_money_object: baseMoney(5312),
      },
    ],
    shipping_method: 'fsdfdsfsdfsdf343432jh4',
  };

  it('accepts the documented calculation payload', () => {
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
      coupons: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an applied coupon and a strikethrough item price, since the calculation item id is the submitted-array index', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      coupons: [
        {
          code: 'WINTER20',
          title: 'Winter Sale',
          discount_type: 'amount-off',
          discount_target: 'order',
          discount_value_type: 'percentage',
          discount_amount_percentage: 20,
          base_discount_amount_fixed_money_object: null,
          base_discount_amount_money_object: baseMoney(12.79),
        },
      ],
      items: [
        {
          ...documentedCalculation.items[0],
          base_strikethrough_price_money_object: baseMoney(6000),
          applied_product_coupons: [
            {
              code: 'PRODCOUPON',
              title: 'Product coupon',
              discount_value_type: 'fixed',
              discount_amount_percentage: null,
              base_discount_amount_fixed_money_object: baseMoney(500),
              base_discount_amount_money_object: baseMoney(500),
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a set of aggregated tax lines, each with only a base money object', () => {
    const result = OrderCalculationSchema.safeParse({
      ...documentedCalculation,
      tax_lines: [
        {
          name: 'VAT',
          rate: 7.5,
          base_amount_money_object: baseMoney(398.15),
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('defaults items, coupons, tax_lines and available_shipping_methods to an empty array when the calculation omits them', () => {
    const { items, coupons, tax_lines, available_shipping_methods, ...rest } = documentedCalculation;
    const result = OrderCalculationSchema.safeParse(rest);
    assert(result.success);
    expect(result.data.items).toEqual([]);
    expect(result.data.coupons).toEqual([]);
    expect(result.data.tax_lines).toEqual([]);
    expect(result.data.available_shipping_methods).toEqual([]);
  });
});
