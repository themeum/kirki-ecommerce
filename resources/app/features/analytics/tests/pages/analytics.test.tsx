import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEY } from '@/features/analytics/hooks/use-analytics-layout';
import { type AnalyticsLayout, DEFAULT_LAYOUT } from '@/features/analytics/lib/layout';
import Analytics from '@/features/analytics/pages/analytics';
import { METRIC_KEYS } from '@/features/analytics/schemas/catalog/analytics';

import {
  buildEmptyRangeOverview,
  buildEmptyStoreOverview,
  buildOverview,
  moneyMetric,
  series,
  splitOverview,
} from '../fixtures';
import { effectiveOpacity, renderPageAt } from '../helpers';

const { useAnalyticsMetricQueries, useAnalyticsRegionsQuery } = vi.hoisted(() => ({
  useAnalyticsMetricQueries: vi.fn(),
  useAnalyticsRegionsQuery: vi.fn(() => ({ isPending: true, isError: false })),
}));

vi.mock('@/features/analytics/services/analytics', () => ({
  useAnalyticsMetricQueries,
  useAnalyticsRegionsQuery,
}));

type QueryState = {
  data?: unknown;
  isLoading?: boolean;
  isPending?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
};

const refetch = vi.fn();
const refetches: Record<string, ReturnType<typeof vi.fn>> = {};

const queryResult = (key: string, state: QueryState) => {
  refetches[key] ??= vi.fn(() => {
    refetch(key);
  });

  return {
    data: undefined,
    isLoading: false,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: refetches[key],
    ...state,
  };
};

const mockQueries = (states: Record<string, QueryState>) => {
  useAnalyticsMetricQueries.mockReturnValue(
    Object.fromEntries(METRIC_KEYS.map((key) => [key, queryResult(key, states[key] ?? {})])),
  );
};

const mockQuery = (state: QueryState) => {
  mockQueries(Object.fromEntries(METRIC_KEYS.map((key) => [key, state])));
};

const mockData = (overview: unknown, overrides: Record<string, QueryState> = {}) => {
  const responses = splitOverview(overview as Record<string, unknown>);

  mockQueries({
    ...Object.fromEntries(METRIC_KEYS.map((key) => [key, { data: responses[key] }])),
    ...overrides,
  });
};

const lastParams = (): unknown => {
  const calls = useAnalyticsMetricQueries.mock.calls as unknown[][];

  return calls[calls.length - 1]?.[0];
};

const KPI_TESTS_IDS = [
  'kpi-gross_sales',
  'kpi-orders',
  'kpi-average_order_value',
  'kpi-returning_customer_rate',
];

const CARDS = [
  ['total_sales_over_time', 'Total sales over time'],
  ['total_sales_breakdown', 'Total sales breakdown'],
  ['sales_by_product', 'Sales by product'],
  ['sales_by_category', 'Sales by category'],
  ['average_order_value_over_time', 'Average order value over time'],
  ['orders_over_time', 'Orders over time'],
  ['orders_by_fulfillment_status', 'Orders by fulfillment status'],
  ['new_vs_returning_customers', 'New vs returning customers'],
  ['sales_by_coupon_code', 'Sales by coupon code'],
  ['orders_by_time_of_day', 'Orders by time of day'],
  ['sales_by_location', 'Sales by location'],
  ['sales_by_payment_method', 'Sales by payment method'],
  ['taxes_by_region', 'Taxes collected by region'],
  ['shipping_charges_by_method', 'Shipping charges by method'],
  ['inventory_health', 'Inventory health'],
] as const;

const CARDS_WITH_DATA_STATE = CARDS.filter(([key]) => key !== 'inventory_health');

const KPI_LABELS = [
  ['gross_sales', 'Gross sales'],
  ['orders', 'Orders'],
  ['average_order_value', 'Average order value'],
  ['returning_customer_rate', 'Returning customer rate'],
] as const;

const TOOLTIPS: [string, string, string][] = [
  [
    'kpi-gross_sales',
    'Gross sales',
    'Item prices × quantity before discounts, without tax or shipping, for orders paid in the range.',
  ],
  [
    'kpi-orders',
    'Orders',
    'Orders created in the range, paid or not. Failed payments are left out.',
  ],
  [
    'kpi-average_order_value',
    'Average order value',
    '(Gross sales − discounts) ÷ number of orders paid in the range. Shipping and tax are left out.',
  ],
  [
    'kpi-returning_customer_rate',
    'Returning customer rate',
    'Customers with a paid order in the range that was not their first paid order, ÷ all customers with a paid order in the range.',
  ],
  [
    'card-total_sales_over_time',
    'Total sales over time',
    'Net sales + shipping + taxes, by the day each order was paid. Refunds are subtracted on the day they completed.',
  ],
  [
    'card-total_sales_breakdown',
    'Total sales breakdown',
    'Gross sales − discounts − returns = net sales. Net sales + shipping + taxes = total sales. Paid orders, by paid date.',
  ],
  [
    'card-sales_by_product',
    'Sales by product',
    'Top products by net sales: item totals after discounts, without tax, for orders paid in the range. Stock is live.',
  ],
  [
    'card-sales_by_category',
    'Sales by category',
    'Net sales of the products in each category. A product in two categories counts in both.',
  ],
  [
    'card-average_order_value_over_time',
    'Average order value over time',
    '(Gross sales − discounts) ÷ paid orders, for each day, week or month.',
  ],
  [
    'card-orders_over_time',
    'Orders over time',
    'Orders created in each day, week or month, paid or not. Failed payments are left out.',
  ],
  [
    'card-orders_by_fulfillment_status',
    'Orders by fulfillment status',
    'Orders created in the range, by their fulfillment status now. Failed payments are left out.',
  ],
  [
    'card-new_vs_returning_customers',
    'New vs returning customers',
    'New: first paid order in the period. Returning: a paid order in the period that was not their first. One customer can be both.',
  ],
  [
    'card-sales_by_coupon_code',
    'Sales by coupon code',
    'Paid orders that used each code, and the total discount the code gave. Free-shipping codes show the shipping fee removed.',
  ],
  [
    'card-sales_by_payment_method',
    'Sales by payment method',
    'Total sales of paid orders, by the payment method used.',
  ],
  [
    'card-taxes_by_region',
    'Taxes collected by region',
    'Product and shipping tax on paid orders, by the shipping address region.',
  ],
  [
    'card-shipping_charges_by_method',
    'Shipping charges by method',
    'Shipping charged on paid orders after free-shipping discounts, without tax, by shipping method.',
  ],
  [
    'card-inventory_health',
    'Inventory health',
    "Live stock of every variant. Low stock means at or below the variant's low-stock threshold, or the store default. Not affected by the date range.",
  ],
  [
    'card-sales_by_location',
    'Sales by location',
    'Where orders go: the shipping address, or the billing address when there is none. Sales: net sales of paid orders. Orders: orders created, paid or not. Customers: different customers with a paid order.',
  ],
];

const renderPage = (search = '') => renderPageAt(`/analytics${search}`, <Analytics />);

beforeEach(() => {
  window.localStorage.clear();
  useAnalyticsMetricQueries.mockReset();
  refetch.mockReset();
  for (const key of Object.keys(refetches)) {
    delete refetches[key];
  }
  mockData(buildOverview());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Analytics page header', () => {
  // Scenario: Open Analytics
  it('has the heading "Analytics" and no "View all reports" button', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.queryByText(/view all reports/i)).not.toBeInTheDocument();
  });
});

describe('Analytics controls', () => {
  it('starts with Last 30 days with its dates and Previous period', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 14, 12, 0, 0));
    renderPage();

    const dateControl = screen.getByTestId('analytics-date-range');

    expect(dateControl).toHaveTextContent('Last 30 days');
    expect(dateControl).toHaveTextContent('Sep 15 – Oct 14, 2026');
    expect(screen.getByTestId('analytics-compare')).toHaveTextContent('Aug 16 – Sep 14, 2026');
    expect(lastParams()).toMatchObject({ range: 'last_30', compare: 'previous_period' });
  });

  // Scenario: No currency control
  it('shows no currency control', () => {
    renderPage();

    expect(screen.queryByTestId('analytics-currency')).not.toBeInTheDocument();
  });

  it('shows the Customize button', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument();
  });

  // Scenario: Change the range
  it('reloads every metric for Last 7 days when the merchant applies it', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('analytics-date-range'));
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(lastParams()).toMatchObject({ range: 'last_7' });
    expect(screen.getByTestId('location')).toHaveTextContent('range=last_7');
  });

  it('reloads with no comparison when the merchant applies it', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('analytics-compare'));
    fireEvent.click(screen.getByRole('button', { name: 'No comparison' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(lastParams()).toMatchObject({ compare: 'none' });
    expect(screen.getByTestId('location')).toHaveTextContent('compare=none');
  });

  // Scenario: Reload keeps the selection
  it('shows the selection kept in the URL: Year to date and No comparison', () => {
    mockData(buildOverview({ top: { compare: null } }));
    renderPage('?range=year_to_date&compare=none');

    expect(screen.getByTestId('analytics-date-range')).toHaveTextContent('Year to date');
    expect(screen.getByTestId('analytics-compare')).toHaveTextContent('No comparison');
    expect(lastParams()).toMatchObject({ range: 'year_to_date', compare: 'none' });
  });

  it('keeps the controls on screen while the data is loading', () => {
    mockQuery({ isLoading: true, isPending: true });
    renderPage();

    expect(screen.getByTestId('analytics-date-range')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-compare')).toBeInTheDocument();
  });
});

describe('Analytics key metrics', () => {
  it('shows the four key metrics in order', () => {
    renderPage();

    const ids = screen
      .getAllByTestId(/^kpi-/)
      .map((element) => element.getAttribute('data-testid'));

    expect(ids).toEqual(KPI_TESTS_IDS);
    for (const [key, label] of KPI_LABELS) {
      expect(within(screen.getByTestId(`kpi-${key}`)).getByText(label)).toBeInTheDocument();
    }
  });

  it('shows the value of each key metric', () => {
    renderPage();

    expect(screen.getByTestId('kpi-gross_sales')).toHaveTextContent('$62.00');
    expect(screen.getByTestId('kpi-orders')).toHaveTextContent('12');
    expect(screen.getByTestId('kpi-average_order_value')).toHaveTextContent('$52.00');
    expect(screen.getByTestId('kpi-returning_customer_rate')).toHaveTextContent('33.3%');
  });

  it('draws a sparkline in every key metric', () => {
    renderPage();

    for (const id of KPI_TESTS_IDS) {
      expect(within(screen.getByTestId(id)).getByTestId('sparkline')).toBeInTheDocument();
    }
  });

  // Scenario: Change colors
  it('shows an increase as "12.3%" with a trending-up icon in the success color', () => {
    renderPage();

    const badge = within(screen.getByTestId('kpi-gross_sales')).getByTestId('change-badge');

    expect(badge).toHaveTextContent('12.3%');
    expect(badge).toHaveAttribute('data-direction', 'up');
    expect(badge).toHaveAttribute('data-tone', 'success');
    expect(badge.querySelector('.lucide-trending-up')).toBeInTheDocument();
  });

  // Scenario: Decrease
  it('shows a decrease as "4.0%" with a trending-down icon in the critical color', () => {
    renderPage();

    const badge = within(screen.getByTestId('kpi-orders')).getByTestId('change-badge');

    expect(badge).toHaveTextContent('4.0%');
    expect(badge).toHaveAttribute('data-direction', 'down');
    expect(badge).toHaveAttribute('data-tone', 'critical');
    expect(badge.querySelector('.lucide-trending-down')).toBeInTheDocument();
  });

  // Scenario: Card headline and Breakdown row
  it('shows every change on the page as text with a trending icon and no background', () => {
    renderPage();

    const badges = screen.getAllByTestId('change-badge');

    expect(badges.length).toBeGreaterThan(4);
    for (const badge of badges) {
      expect(
        badge.querySelector('.lucide-trending-up, .lucide-trending-down, .lucide-minus'),
      ).toBeInTheDocument();
      expect(getComputedStyle(badge).backgroundColor).toMatch(
        /^(rgba\(0, 0, 0, 0\)|transparent|)$/,
      );
    }
  });

  it('shows no badge when the change is empty because the comparison value is zero', () => {
    renderPage();

    expect(
      within(screen.getByTestId('kpi-returning_customer_rate')).queryByTestId('change-badge'),
    ).not.toBeInTheDocument();
  });

  it('reads "No comparison" in every key metric when there is no comparison', () => {
    mockData(buildOverview({ top: { compare: null } }));
    renderPage('?compare=none');

    for (const id of KPI_TESTS_IDS) {
      const kpi = screen.getByTestId(id);

      expect(within(kpi).getByText('No comparison')).toBeInTheDocument();
      expect(within(kpi).queryByTestId('change-badge')).not.toBeInTheDocument();
    }
  });
});

describe('Analytics cards', () => {
  it('shows the 15 cards in order with their titles', () => {
    renderPage();

    const ids = screen
      .getAllByTestId(/^card-/)
      .map((element) => element.getAttribute('data-testid'));

    expect(ids).toEqual(CARDS.map(([key]) => `card-${key}`));
    for (const [key, title] of CARDS) {
      expect(within(screen.getByTestId(`card-${key}`)).getByText(title)).toBeInTheDocument();
    }
  });

  it('shows the Total sales breakdown rows in order with Net and Total in bold', () => {
    renderPage();

    const card = screen.getByTestId('card-total_sales_breakdown');
    const labels = [
      'Gross sales',
      'Discounts',
      'Returns',
      'Net sales',
      'Shipping charges',
      'Taxes',
      'Total sales',
    ];

    for (const label of labels) {
      expect(within(card).getByText(label)).toBeInTheDocument();
    }
    expect(within(card).getByTestId('breakdown-row-net_sales')).toHaveAttribute(
      'data-emphasis',
      'bold',
    );
    expect(within(card).getByTestId('breakdown-row-total_sales')).toHaveAttribute(
      'data-emphasis',
      'bold',
    );
    expect(within(card).getByTestId('breakdown-row-gross_sales')).not.toHaveAttribute(
      'data-emphasis',
      'bold',
    );
  });

  it('shows the headline of Orders by fulfillment status', () => {
    renderPage();

    const card = within(screen.getByTestId('card-orders_by_fulfillment_status'));

    expect(card.getByRole('heading', { name: '50%' })).toBeInTheDocument();
    expect(card.getByText('delivered · 12 orders')).toBeInTheDocument();
  });

  // Scenario: New vs returning customers
  it('shows the customers headline and the totals legend of New vs returning customers', () => {
    renderPage();

    const card = within(screen.getByTestId('card-new_vs_returning_customers'));

    expect(card.getByRole('heading', { name: '9' })).toBeInTheDocument();
    expect(card.getByText(/^customers?$/)).toBeInTheDocument();
    expect(card.getByText('New · 6')).toBeInTheDocument();
    expect(card.getByText('Returning · 3')).toBeInTheDocument();
  });

  // Scenario: Stock badge in Sales by product
  it('shows "3 left in stock" in the warning badge for a low-stock top product', () => {
    renderPage();

    const badge = within(screen.getByTestId('card-sales_by_product')).getByText('3 left in stock');

    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-variant', 'warning');
  });

  // Scenario: Growth in Sales by category
  it('shows one bar and the growth rate for each category in Sales by category', () => {
    renderPage();

    const card = within(screen.getByTestId('card-sales_by_category'));

    expect(card.getByTestId('change-badge')).toHaveTextContent('36.7%');
    expect(card.getByTestId('change-badge')).toHaveAttribute('data-direction', 'up');
    expect(card.queryByText('$30.00')).not.toBeInTheDocument();
  });

  // Scenario: Coupon code bars
  it('shows one bar with orders, discount and growth rate for each code in Sales by coupon code', () => {
    renderPage();

    const card = within(screen.getByTestId('card-sales_by_coupon_code'));

    expect(card.getByText('FREESHIP50')).toBeInTheDocument();
    expect(card.getByText('4')).toBeInTheDocument();
    expect(card.getByText('$32.00 off')).toBeInTheDocument();
    expect(card.getByTestId('change-badge')).toHaveTextContent('33.3%');
    expect(card.queryByText('4 orders')).not.toBeInTheDocument();
  });

  // Scenario: Payment method bars
  it('shows one bar with total sales, orders and growth rate for each method in Sales by payment method', () => {
    renderPage();

    const card = within(screen.getByTestId('card-sales_by_payment_method'));
    const badges = card.getAllByTestId('change-badge');

    expect(card.getByText('Stripe')).toBeInTheDocument();
    expect(card.getByText('$20.7K')).toHaveAttribute('title', '$20680.27');
    expect(card.getByText('209 orders')).toBeInTheDocument();
    expect(badges[0]).toHaveTextContent('36.1%');
    expect(badges[0]).toHaveAttribute('data-direction', 'up');
    expect(card.getByText('27 orders')).toBeInTheDocument();
    expect(badges[1]).toHaveTextContent('8.8%');
    expect(badges[1]).toHaveAttribute('data-direction', 'down');
  });

  // Scenario: Tax region bars, Shipping method bars
  it('shows one bar with value, secondary data and growth rate in Taxes collected by region and Shipping charges by method', () => {
    renderPage();

    const taxes = within(screen.getByTestId('card-taxes_by_region'));
    const shipping = within(screen.getByTestId('card-shipping_charges_by_method'));

    expect(taxes.getByText('Texas, United States')).toBeInTheDocument();
    expect(taxes.getByText('$6.01')).toBeInTheDocument();
    expect(taxes.getByText('Product $5.00 · Shipping $1.01')).toBeInTheDocument();
    expect(taxes.getByTestId('change-badge')).toHaveTextContent('25.0%');
    expect(taxes.getByTestId('change-badge')).toHaveAttribute('data-direction', 'up');
    expect(shipping.getByText('Standard')).toBeInTheDocument();
    expect(shipping.getByText('$8.00')).toBeInTheDocument();
    expect(shipping.getByText('7 orders')).toBeInTheDocument();
    expect(shipping.getByTestId('change-badge')).toHaveTextContent('10.0%');
    expect(shipping.getByTestId('change-badge')).toHaveAttribute('data-direction', 'down');
  });

  // Scenario: Summary line
  it('shows the busiest hour, the busiest day and the share from the busiest hour on', () => {
    renderPage();

    const summary = within(screen.getByTestId('time-of-day-summary'));

    expect(summary.getByText('Fri 6pm–7pm')).toBeInTheDocument();
    expect(summary.getByText('Tuesday')).toBeInTheDocument();
    expect(summary.getByText('After 6pm')).toBeInTheDocument();
    expect(summary.getByText('50%')).toBeInTheDocument();
  });

  it('shows the day totals and a tooltip on each dot in Orders by time of day', () => {
    renderPage();

    const card = within(screen.getByTestId('card-orders_by_time_of_day'));

    expect(card.getByTestId('dot-grid-row-1')).toHaveTextContent(/6$/);

    fireEvent.mouseEnter(card.getByRole('button', { name: 'Fri 6pm–7pm · 5 orders' }));

    expect(card.getByRole('tooltip')).toHaveTextContent('Fri 6pm–7pm · 5 orders');
  });

  // Scenario: No comparison
  it('hides the This period and Change toggle when there is no comparison', () => {
    const overview = buildOverview({ top: { compare: null } });

    mockData({
      ...overview,
      cards: {
        ...overview.cards,
        orders_by_time_of_day: { ...overview.cards.orders_by_time_of_day, previous: null },
      },
    });
    renderPage('?compare=none');

    const card = within(screen.getByTestId('card-orders_by_time_of_day'));

    expect(card.queryByRole('tab', { name: 'Change' })).not.toBeInTheDocument();
    expect(card.getByText('Bigger, darker dot = more')).toBeInTheDocument();
  });

  // Scenario: Change colors
  it('shows more orders in purple and fewer orders in gray in the Change view', () => {
    renderPage();

    const card = within(screen.getByTestId('card-orders_by_time_of_day'));

    fireEvent.mouseDown(card.getByRole('tab', { name: 'Change' }), { button: 0 });

    const more = card.getByRole('button', { name: 'Fri 6pm–7pm · 5 orders, 2 before (+3)' });
    const fewer = card.getByRole('button', { name: 'Tue 9am–10am · 3 orders, 4 before (-1)' });
    const moreDot = more.querySelector<HTMLElement>('[data-dot]');
    const fewerDot = fewer.querySelector<HTMLElement>('[data-dot]');

    expect(moreDot).toHaveAttribute('data-direction', 'up');
    expect(fewerDot).toHaveAttribute('data-direction', 'down');
    expect(parseFloat(fewerDot?.style.width ?? '0')).toBeLessThan(
      parseFloat(moreDot?.style.width ?? '0'),
    );
    expect(card.getByText(/^More than /)).toBeInTheDocument();

    fireEvent.focus(more);

    expect(card.getByRole('tooltip')).toHaveTextContent('Fri 6pm–7pm · 5 orders, 2 before (+3)');
  });

  it('shows the live note in Inventory health', () => {
    renderPage();

    expect(
      within(screen.getByTestId('card-inventory_health')).getByText(
        'Live, not affected by the date range',
      ),
    ).toBeInTheDocument();
  });

  // Scenario: Count tiles
  it('shows the stock counts as tiles in Inventory health', () => {
    renderPage();
    const card = within(screen.getByTestId('card-inventory_health'));

    expect(card.getByText('1').nextSibling).toHaveTextContent('Out of stock');
    expect(card.getByText('2').nextSibling).toHaveTextContent('Low stock');
    expect(card.getByText('30').nextSibling).toHaveTextContent('In stock');
  });

  // Scenario: Variant row badge
  it('shows a status badge without the quantity on each Inventory health row', () => {
    renderPage();
    const card = within(screen.getByTestId('card-inventory_health'));
    const row = within(card.getByText('Hoodie').closest('li') as HTMLElement);

    expect(row.getByText('Blue / M')).toBeInTheDocument();
    expect(row.getByText('Out of stock')).toHaveAttribute('data-tone', 'critical');
    expect(row.queryByText('-2')).not.toBeInTheDocument();
  });

  // Scenario: No variant needs attention
  it('shows no list in Inventory health when no variant needs attention', () => {
    mockData(
      buildOverview({
        cards: { inventory_health: { out_of_stock: 0, low_stock: 0, in_stock: 30, lowest: [] } },
      }),
    );
    renderPage();
    const card = within(screen.getByTestId('card-inventory_health'));

    expect(card.queryByRole('list')).not.toBeInTheDocument();
    expect(card.getByTestId('live-indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  // Scenario: Breakdown line is not a link
  it('opens nothing when the merchant selects the Discounts line', () => {
    renderPage();
    const before = screen.getByTestId('location').textContent;

    const card = screen.getByTestId('card-total_sales_breakdown');
    fireEvent.click(within(card).getByText('Discounts'));

    expect(screen.getByTestId('location').textContent).toBe(before);
    expect(within(card).queryAllByRole('link')).toHaveLength(0);
  });

  it('has no link in any key metric or card', () => {
    renderPage();

    for (const id of [...KPI_TESTS_IDS, ...CARDS.map(([key]) => `card-${key}`)]) {
      const element = screen.getByTestId(id);

      expect(element.querySelectorAll('a, [role="link"]')).toHaveLength(0);
    }
  });
});

describe('Analytics info tooltips', () => {
  it.each(TOOLTIPS)('%s has an info icon named by its tooltip text', (testId, title, tooltip) => {
    renderPage();

    const element = screen.getByTestId(testId);

    expect(within(element).getByText(title)).toBeInTheDocument();
    expect(within(element).getByRole('button', { name: tooltip })).toBeInTheDocument();
  });

  // Scenario: Icon is hidden until hover
  it('hides the info icon of the Orders key metric while the pointer is away', () => {
    renderPage();

    const icon = within(screen.getByTestId('kpi-orders')).getByRole('button', {
      name: TOOLTIPS[1][2],
    });

    expect(effectiveOpacity(icon)).toBe(0);
  });

  // Scenario: Hover shows the icon and tooltip
  it('shows the tooltip text of the Orders key metric when the pointer is over its icon', async () => {
    renderPage();

    const icon = within(screen.getByTestId('kpi-orders')).getByRole('button', {
      name: TOOLTIPS[1][2],
    });
    fireEvent.pointerMove(icon);

    expect((await screen.findAllByRole('tooltip'))[0]).toHaveTextContent(
      'Orders created in the range, paid or not. Failed payments are left out.',
    );
  });

  // Scenario: Keyboard
  it('shows the icon of Sales by category and opens its tooltip on keyboard focus', async () => {
    renderPage();

    const icon = within(screen.getByTestId('card-sales_by_category')).getByRole('button', {
      name: TOOLTIPS[7][2],
    });
    act(() => icon.focus());

    expect(effectiveOpacity(icon)).toBe(1);
    expect((await screen.findAllByRole('tooltip'))[0]).toHaveTextContent(TOOLTIPS[7][2]);
  });
});

describe('Analytics page states', () => {
  it('shows skeletons in the final layout while loading', () => {
    mockQuery({ isLoading: true, isPending: true });
    renderPage();

    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4);
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(15);
    expect(screen.queryByTestId('card-total_sales_over_time')).not.toBeInTheDocument();
  });

  // Scenario: Request fails
  it('shows the error state with a retry action when every request fails', () => {
    mockQuery({ isError: true, error: new Error('Server error') });
    renderPage();

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-error')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(refetch).toHaveBeenCalledTimes(METRIC_KEYS.length);
  });

  // Scenario: One card loads first
  it('shows a card as soon as its data comes while the others keep their skeletons', () => {
    mockQueries({
      sales_by_coupon_code: { data: splitOverview(buildOverview()).sales_by_coupon_code },
    });
    renderPage();

    expect(screen.getByTestId('card-sales_by_coupon_code')).toBeInTheDocument();
    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4);
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(14);
  });

  // Scenario: One card fails
  it('shows an error with a retry action only in the card whose request failed', () => {
    mockData(buildOverview(), { taxes_by_region: { isError: true, error: new Error('Server') } });
    renderPage();

    const failed = screen.getByTestId('card-error-taxes_by_region');
    expect(within(failed).getByText('Taxes collected by region')).toBeInTheDocument();
    expect(within(failed).getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByTestId('card-taxes_by_region')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-shipping_charges_by_method')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-orders')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /try again/i })).toHaveLength(1);
  });

  // Scenario: Retry one card
  it('requests only the failed card again on retry', () => {
    mockData(buildOverview(), { taxes_by_region: { isError: true, error: new Error('Server') } });
    renderPage();

    fireEvent.click(
      within(screen.getByTestId('card-error-taxes_by_region')).getByRole('button', {
        name: /try again/i,
      }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith('taxes_by_region');
  });

  it('shows a skeleton in place of the failed card while its retry loads', () => {
    mockData(buildOverview(), {
      taxes_by_region: { isError: true, isFetching: true, error: new Error('Server') },
    });
    renderPage();

    expect(screen.queryByTestId('card-error-taxes_by_region')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows the key metric skeletons while the key metrics retry loads', () => {
    mockData(buildOverview(), {
      kpis: { isError: true, isFetching: true, error: new Error('Server') },
    });
    renderPage();

    expect(screen.queryByTestId('kpi-error')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4);
  });

  it('shows one error with a retry action across the key metrics row when only the key metrics fail', () => {
    mockData(buildOverview(), { kpis: { isError: true, error: new Error('Server') } });
    renderPage();

    fireEvent.click(
      within(screen.getByTestId('kpi-error')).getByRole('button', { name: /try again/i }),
    );

    expect(screen.queryByTestId('kpi-orders')).not.toBeInTheDocument();
    expect(screen.getByTestId('card-total_sales_over_time')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledWith('kpis');
  });

  // Scenario: Empty store
  it('shows the banner and an empty state in each card except Inventory health for a store with no orders', () => {
    mockData(buildEmptyStoreOverview());
    renderPage();

    expect(
      screen.getByText(
        'Your store has no orders yet. Analytics fills in as soon as customers start paying for orders.',
      ),
    ).toBeInTheDocument();
    for (const [key] of CARDS_WITH_DATA_STATE) {
      expect(
        within(screen.getByTestId(`card-${key}`)).getByTestId('card-empty'),
      ).toBeInTheDocument();
    }
    expect(
      within(screen.getByTestId('card-inventory_health')).queryByTestId('card-empty'),
    ).not.toBeInTheDocument();
  });

  it('shows 0 or an empty value in the key metrics for a store with no orders', () => {
    mockData(buildEmptyStoreOverview());
    renderPage();

    expect(screen.getByTestId('kpi-orders')).toHaveTextContent('0');
    expect(screen.getByTestId('kpi-gross_sales')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('kpi-average_order_value')).toHaveTextContent('—');
  });

  // Scenario: Range without sales
  it('shows "No data for this date range" in the cards, and no banner, when the store has orders but none in the range', () => {
    mockData(buildEmptyRangeOverview());
    renderPage();

    expect(screen.queryByText(/Your store has no orders yet/)).not.toBeInTheDocument();
    for (const [key] of CARDS_WITH_DATA_STATE) {
      expect(
        within(screen.getByTestId(`card-${key}`)).getByText('No data for this date range'),
      ).toBeInTheDocument();
    }
    expect(
      within(screen.getByTestId('card-inventory_health')).queryByText(
        'No data for this date range',
      ),
    ).not.toBeInTheDocument();
  });

  it('does not show the banner when the store has orders', () => {
    renderPage();

    expect(screen.queryByText(/Your store has no orders yet/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-empty')).not.toBeInTheDocument();
  });
});

const saveLayout = (layout: AnalyticsLayout) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
};

const withVisible = (
  layout: AnalyticsLayout,
  changes: Partial<Record<string, boolean>>,
): AnalyticsLayout => ({
  kpis: layout.kpis.map((item) => ({ ...item, visible: changes[item.key] ?? item.visible })),
  cards: layout.cards.map((item) => ({ ...item, visible: changes[item.key] ?? item.visible })),
  amounts: layout.amounts,
});

const lastEnabledKeys = () => {
  const calls = useAnalyticsMetricQueries.mock.calls as unknown[][];

  return [...(calls[calls.length - 1]?.[1] as Set<string>)];
};

const kpiTestIds = () =>
  Array.from(document.querySelectorAll('[data-testid^="kpi-"]')).map((node) =>
    node.getAttribute('data-testid'),
  );

const cardTestIds = () =>
  Array.from(document.querySelectorAll('[data-testid^="card-"]'))
    .map((node) => node.getAttribute('data-testid') ?? '')
    .filter((id) => /^card-[a-z_]+$/.test(id) && id !== 'card-skeleton' && id !== 'card-empty');

const openCardMenu = (title: string) => {
  fireEvent.pointerDown(screen.getByRole('button', { name: `More actions for ${title}` }), {
    button: 0,
    ctrlKey: false,
  });
};

const openCustomize = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Customize' }));

  return screen.getByRole('dialog', { name: 'Customize analytics' });
};

describe('Analytics customize', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it('shows the default 4 key metrics and requests every card by default', () => {
    renderPage();

    expect(kpiTestIds()).toEqual(KPI_TESTS_IDS);
    expect(lastEnabledKeys().sort()).toEqual([...METRIC_KEYS].sort());
  });

  // Scenario: Hidden card is not requested
  it('does not show or request a hidden card', () => {
    saveLayout(withVisible(DEFAULT_LAYOUT, { sales_by_coupon_code: false }));
    renderPage();

    expect(screen.queryByTestId('card-sales_by_coupon_code')).not.toBeInTheDocument();
    expect(lastEnabledKeys()).not.toContain('sales_by_coupon_code');
    expect(lastEnabledKeys()).toContain('kpis');
  });

  // Scenario: Turn a card on
  it('requests a card and shows its skeleton when the merchant turns it on', () => {
    saveLayout(withVisible(DEFAULT_LAYOUT, { sales_by_coupon_code: false }));
    mockData(buildOverview(), { sales_by_coupon_code: { isPending: true } });
    renderPage();

    expect(screen.queryAllByTestId('card-skeleton')).toHaveLength(0);

    const sheet = openCustomize();
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Sales by coupon code' }));

    expect(lastEnabledKeys()).toContain('sales_by_coupon_code');
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(1);
  });

  // Scenario: Saved order
  it('shows the key metrics and cards in the saved order', () => {
    saveLayout({
      kpis: [DEFAULT_LAYOUT.kpis[1], DEFAULT_LAYOUT.kpis[0], ...DEFAULT_LAYOUT.kpis.slice(2)],
      cards: [DEFAULT_LAYOUT.cards[14], ...DEFAULT_LAYOUT.cards.slice(0, 14)],
      amounts: 'short',
    });
    renderPage();

    expect(kpiTestIds().slice(0, 2)).toEqual(['kpi-orders', 'kpi-gross_sales']);
    expect(cardTestIds()[0]).toBe('card-inventory_health');
  });

  // Scenario: Five key metrics on a wide screen
  it('shows extra key metrics in a 4-column grid with their values', () => {
    saveLayout(withVisible(DEFAULT_LAYOUT, { net_sales: true }));
    renderPage();

    const netSales = screen.getByTestId('kpi-net_sales');

    expect(kpiTestIds()).toEqual([...KPI_TESTS_IDS, 'kpi-net_sales']);
    expect(within(netSales).getByText('Net sales')).toBeInTheDocument();
    expect(window.getComputedStyle(netSales.parentElement as Element).gridTemplateColumns).toBe(
      'repeat(4, minmax(0, 1fr))',
    );
  });

  it('formats each new key metric as money or a number', () => {
    saveLayout(
      withVisible(DEFAULT_LAYOUT, {
        net_sales: true,
        total_sales: true,
        items_ordered: true,
        discounts: true,
        new_customers: true,
        customers: true,
        shipping_charges: true,
      }),
    );
    renderPage();

    expect(within(screen.getByTestId('kpi-items_ordered')).getByText('30')).toBeInTheDocument();
    expect(within(screen.getByTestId('kpi-new_customers')).getByText('8')).toBeInTheDocument();
    expect(within(screen.getByTestId('kpi-customers')).getByText('10')).toBeInTheDocument();
    expect(within(screen.getByTestId('kpi-net_sales')).getByText(/\$52\.00/)).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kpi-shipping_charges')).getByText(/\$8\.00/),
    ).toBeInTheDocument();
  });

  it('shows one key metric skeleton for each key metric that is on', () => {
    saveLayout(withVisible(DEFAULT_LAYOUT, { net_sales: true, customers: true }));
    mockQuery({ isLoading: true, isPending: true });
    renderPage();

    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(6);
  });

  // Scenario: Hide a key metric
  it('hides a key metric from its menu and clears its checkbox', () => {
    renderPage();

    openCardMenu('Gross sales');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide from page' }));

    expect(screen.queryByTestId('kpi-gross_sales')).not.toBeInTheDocument();

    const sheet = openCustomize();

    expect(within(sheet).getByRole('checkbox', { name: 'Gross sales' })).not.toBeChecked();
  });

  it('hides a card from its menu and stops requesting it', () => {
    renderPage();

    openCardMenu('Sales by coupon code');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide from page' }));

    expect(screen.queryByTestId('card-sales_by_coupon_code')).not.toBeInTheDocument();
    expect(lastEnabledKeys()).not.toContain('sales_by_coupon_code');
  });

  it('gives a card that shows an error the menu', () => {
    mockData(buildOverview(), { taxes_by_region: { isError: true, error: new Error('Server') } });
    renderPage();

    expect(
      within(screen.getByTestId('card-error-taxes_by_region')).getByRole('button', {
        name: 'More actions for Taxes collected by region',
      }),
    ).toBeInTheDocument();
  });

  // Scenario: Last key metric
  it('locks the last key metric that is on', () => {
    saveLayout(
      withVisible(DEFAULT_LAYOUT, {
        gross_sales: false,
        average_order_value: false,
        returning_customer_rate: false,
      }),
    );
    renderPage();

    openCardMenu('Orders');

    expect(screen.getByRole('menuitem', { name: 'Hide from page' })).toHaveAttribute(
      'data-disabled',
    );

    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Hide from page' }), { key: 'Escape' });
    const sheet = openCustomize();

    expect(within(sheet).getByRole('checkbox', { name: 'Orders' })).toBeDisabled();
    expect(within(sheet).getByRole('checkbox', { name: 'Sales by product' })).toBeEnabled();
  });

  // Scenario: Hidden neighbor
  it('lets a half card fill its row when its neighbor is hidden', () => {
    saveLayout(withVisible(DEFAULT_LAYOUT, { total_sales_breakdown: false }));
    renderPage();

    const coupon = screen.getByTestId('card-sales_by_coupon_code');

    expect(coupon).toHaveAttribute('data-size', 'half');
    expect(window.getComputedStyle(coupon).flexGrow).toBe('1');
  });

  // Scenario: Reset
  it('restores the default layout on Reset to default', () => {
    saveLayout(
      withVisible(
        {
          kpis: [DEFAULT_LAYOUT.kpis[1], DEFAULT_LAYOUT.kpis[0], ...DEFAULT_LAYOUT.kpis.slice(2)],
          cards: DEFAULT_LAYOUT.cards,
          amounts: 'long',
        },
        { sales_by_product: false, taxes_by_region: false, inventory_health: false },
      ),
    );
    renderPage();

    const sheet = openCustomize();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Reset to default' }));

    expect(kpiTestIds()).toEqual(KPI_TESTS_IDS);
    expect(screen.getByTestId('card-sales_by_product')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(DEFAULT_LAYOUT);
  });

  // Scenario: Layout persists
  it('keeps a hidden card hidden when the page opens again', () => {
    const { unmount } = renderPage();

    openCardMenu('Sales by coupon code');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide from page' }));
    unmount();
    renderPage();

    expect(screen.queryByTestId('card-sales_by_coupon_code')).not.toBeInTheDocument();
  });
});

const buildLargeOverview = () =>
  buildOverview({
    kpis: {
      gross_sales: {
        ...moneyMetric(2034500, 1500000, 35.6),
        series: series([1000, 2200, 3000], [900, 1900, 2700]),
      },
    },
    cards: {
      total_sales_over_time: {
        total: moneyMetric(2034500, 1500000, 35.6),
        series: series([1000, 2200, 2034500], [900, 1900, 1500000]),
      },
    },
  });

const grossSalesValue = () => within(screen.getByTestId('kpi-gross_sales')).getByText(/^\$20/);

describe('Analytics amount format', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  beforeEach(() => {
    mockData(buildLargeOverview());
  });

  // Scenario: Short format
  it('shows short amounts by default, with the long amount as the title', () => {
    renderPage();

    expect(grossSalesValue()).toHaveTextContent('$20.3K');
    expect(grossSalesValue()).toHaveAttribute('title', '$20345.00');
    expect(
      within(screen.getByTestId('card-total_sales_over_time')).getByText('$20.3K'),
    ).toHaveAttribute('title', '$20345.00');
  });

  // Scenario: Small amount in Short format
  it('shows a small amount with its decimals, and its title is the same text', () => {
    renderPage();

    const value = within(screen.getByTestId('kpi-average_order_value')).getByText('$52.00');

    expect(value).toHaveAttribute('title', '$52.00');
  });

  // Scenario: Long format
  it('shows long amounts with no extra title when Long is selected, and sends no new request', () => {
    renderPage();

    const params = lastParams();
    const sheet = openCustomize();

    fireEvent.click(within(sheet).getByRole('radio', { name: 'Long ($20345.00)' }));

    expect(grossSalesValue()).toHaveTextContent('$20345.00');
    expect(grossSalesValue()).toHaveAttribute('title', '$20345.00');
    expect(
      within(screen.getByTestId('card-total_sales_over_time')).getByText('$20345.00'),
    ).not.toHaveAttribute('title');
    expect(lastParams()).toBe(params);
    expect(lastEnabledKeys().sort()).toEqual([...METRIC_KEYS].sort());
  });

  // Scenario: Amount examples
  it('shows the two formats with the examples from the backend, Short selected', () => {
    renderPage();

    const sheet = openCustomize();

    expect(within(sheet).getByRole('radiogroup', { name: 'Amounts' })).toBeInTheDocument();
    expect(within(sheet).getByRole('radio', { name: 'Short ($20.3K)' })).toBeChecked();
    expect(within(sheet).getByRole('radio', { name: 'Long ($20345.00)' })).not.toBeChecked();
  });

  // Scenario: Amount format persists
  it('keeps Long when the page opens again', () => {
    const { unmount } = renderPage();

    fireEvent.click(within(openCustomize()).getByRole('radio', { name: 'Long ($20345.00)' }));
    unmount();
    renderPage();

    expect(grossSalesValue()).toHaveTextContent('$20345.00');
    expect(within(openCustomize()).getByRole('radio', { name: 'Long ($20345.00)' })).toBeChecked();
  });

  // Scenario: Reset
  it('sets Short again on Reset to default', () => {
    saveLayout({ ...DEFAULT_LAYOUT, amounts: 'long' });
    renderPage();

    const sheet = openCustomize();

    fireEvent.click(within(sheet).getByRole('button', { name: 'Reset to default' }));

    expect(grossSalesValue()).toHaveTextContent('$20.3K');
    expect(within(sheet).getByRole('radio', { name: 'Short ($20.3K)' })).toBeChecked();
  });

  // Scenario: Chart tooltip
  it('keeps the long amount in the chart tooltip in Short mode', () => {
    renderPage();

    const card = within(screen.getByTestId('card-total_sales_over_time'));

    fireEvent.pointerEnter(card.getByTestId('chart-point-2'));
    fireEvent.mouseOver(card.getByTestId('chart-point-2'));

    expect(card.getByRole('tooltip')).toHaveTextContent('$20,345.00');
  });
});
