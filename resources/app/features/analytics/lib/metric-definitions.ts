import { __ } from '@/wpi18n';

type MetricKey =
  | 'gross_sales'
  | 'orders'
  | 'average_order_value'
  | 'returning_customer_rate'
  | 'net_sales'
  | 'total_sales'
  | 'items_ordered'
  | 'discounts'
  | 'new_customers'
  | 'customers'
  | 'shipping_charges'
  | 'total_sales_over_time'
  | 'total_sales_breakdown'
  | 'sales_by_product'
  | 'sales_by_category'
  | 'average_order_value_over_time'
  | 'orders_over_time'
  | 'orders_by_fulfillment_status'
  | 'new_vs_returning_customers'
  | 'sales_by_coupon_code'
  | 'orders_by_time_of_day'
  | 'sales_by_location'
  | 'sales_by_payment_method'
  | 'taxes_by_region'
  | 'shipping_charges_by_method'
  | 'inventory_health';

type MetricDefinition = {
  title: string;
  info: string;
};

const getMetricDefinitions = (): Record<MetricKey, MetricDefinition> => ({
  gross_sales: {
    title: __('Gross sales', 'kirki-ecommerce'),
    info: __(
      'Item prices × quantity before discounts, without tax or shipping, for orders paid in the range.',
      'kirki-ecommerce',
    ),
  },
  orders: {
    title: __('Orders', 'kirki-ecommerce'),
    info: __(
      'Orders created in the range, paid or not. Failed payments are left out.',
      'kirki-ecommerce',
    ),
  },
  average_order_value: {
    title: __('Average order value', 'kirki-ecommerce'),
    info: __(
      '(Gross sales − discounts) ÷ number of orders paid in the range. Shipping and tax are left out.',
      'kirki-ecommerce',
    ),
  },
  returning_customer_rate: {
    title: __('Returning customer rate', 'kirki-ecommerce'),
    info: __(
      'Customers with a paid order in the range that was not their first paid order, ÷ all customers with a paid order in the range.',
      'kirki-ecommerce',
    ),
  },
  net_sales: {
    title: __('Net sales', 'kirki-ecommerce'),
    info: __(
      'Gross sales − discounts − returns, for orders paid in the range. Refunds are subtracted on the day they completed.',
      'kirki-ecommerce',
    ),
  },
  total_sales: {
    title: __('Total sales', 'kirki-ecommerce'),
    info: __('Net sales + shipping + taxes, for orders paid in the range.', 'kirki-ecommerce'),
  },
  items_ordered: {
    title: __('Items ordered', 'kirki-ecommerce'),
    info: __(
      'Items in the orders created in the range, paid or not. Failed payments are left out.',
      'kirki-ecommerce',
    ),
  },
  discounts: {
    title: __('Discounts', 'kirki-ecommerce'),
    info: __(
      'Discounts on item prices in orders paid in the range. Free-shipping discounts are left out.',
      'kirki-ecommerce',
    ),
  },
  new_customers: {
    title: __('New customers', 'kirki-ecommerce'),
    info: __('Customers whose first paid order is in the range.', 'kirki-ecommerce'),
  },
  customers: {
    title: __('Customers', 'kirki-ecommerce'),
    info: __('Different customers with a paid order in the range.', 'kirki-ecommerce'),
  },
  shipping_charges: {
    title: __('Shipping charges', 'kirki-ecommerce'),
    info: __(
      'Shipping charged on paid orders after free-shipping discounts, without tax.',
      'kirki-ecommerce',
    ),
  },
  total_sales_over_time: {
    title: __('Total sales over time', 'kirki-ecommerce'),
    info: __(
      'Net sales + shipping + taxes, by the day each order was paid. Refunds are subtracted on the day they completed.',
      'kirki-ecommerce',
    ),
  },
  total_sales_breakdown: {
    title: __('Total sales breakdown', 'kirki-ecommerce'),
    info: __(
      'Gross sales − discounts − returns = net sales. Net sales + shipping + taxes = total sales. Paid orders, by paid date.',
      'kirki-ecommerce',
    ),
  },
  sales_by_product: {
    title: __('Sales by product', 'kirki-ecommerce'),
    info: __(
      'Top products by net sales: item totals after discounts, without tax, for orders paid in the range. Stock is live.',
      'kirki-ecommerce',
    ),
  },
  sales_by_category: {
    title: __('Sales by category', 'kirki-ecommerce'),
    info: __(
      'Net sales of the products in each category. A product in two categories counts in both.',
      'kirki-ecommerce',
    ),
  },
  average_order_value_over_time: {
    title: __('Average order value over time', 'kirki-ecommerce'),
    info: __(
      '(Gross sales − discounts) ÷ paid orders, for each day, week or month.',
      'kirki-ecommerce',
    ),
  },
  orders_over_time: {
    title: __('Orders over time', 'kirki-ecommerce'),
    info: __(
      'Orders created in each day, week or month, paid or not. Failed payments are left out.',
      'kirki-ecommerce',
    ),
  },
  orders_by_fulfillment_status: {
    title: __('Orders by fulfillment status', 'kirki-ecommerce'),
    info: __(
      'Orders created in the range, by their fulfillment status now. Failed payments are left out.',
      'kirki-ecommerce',
    ),
  },
  new_vs_returning_customers: {
    title: __('New vs returning customers', 'kirki-ecommerce'),
    info: __(
      'New: first paid order in the period. Returning: a paid order in the period that was not their first. One customer can be both.',
      'kirki-ecommerce',
    ),
  },
  sales_by_coupon_code: {
    title: __('Sales by coupon code', 'kirki-ecommerce'),
    info: __(
      'Paid orders that used each code, and the total discount the code gave. Free-shipping codes show the shipping fee removed.',
      'kirki-ecommerce',
    ),
  },
  orders_by_time_of_day: {
    title: __('Orders by time of day', 'kirki-ecommerce'),
    info: __(
      'Orders placed in the range, by the weekday and hour of the store time zone. Failed payments are left out.',
      'kirki-ecommerce',
    ),
  },
  sales_by_location: {
    title: __('Sales by location', 'kirki-ecommerce'),
    info: __(
      'Where orders go: the shipping address, or the billing address when there is none. Sales: net sales of paid orders. Orders: orders created, paid or not. Customers: different customers with a paid order.',
      'kirki-ecommerce',
    ),
  },
  sales_by_payment_method: {
    title: __('Sales by payment method', 'kirki-ecommerce'),
    info: __('Total sales of paid orders, by the payment method used.', 'kirki-ecommerce'),
  },
  taxes_by_region: {
    title: __('Taxes collected by region', 'kirki-ecommerce'),
    info: __(
      'Product and shipping tax on paid orders, by the shipping address region.',
      'kirki-ecommerce',
    ),
  },
  shipping_charges_by_method: {
    title: __('Shipping charges by method', 'kirki-ecommerce'),
    info: __(
      'Shipping charged on paid orders after free-shipping discounts, without tax, by shipping method.',
      'kirki-ecommerce',
    ),
  },
  inventory_health: {
    title: __('Inventory health', 'kirki-ecommerce'),
    info: __(
      "Live stock of every variant. Low stock means at or below the variant's low-stock threshold, or the store default. Not affected by the date range.",
      'kirki-ecommerce',
    ),
  },
});

export { getMetricDefinitions };
export type { MetricDefinition, MetricKey };
