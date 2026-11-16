import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import HomeSections from '@/features/home/components/home-sections';
import { useHomeLayout } from '@/features/home/hooks/use-home-layout';
import { HOME_LAYOUT_STORAGE_KEY } from '@/features/home/hooks/use-home-layout';
import { DEFAULT_HOME_LAYOUT, type HomeLayout } from '@/features/home/lib/layout';

const { useDashboardOverviewQuery, useDashboardAttentionQuery, useAnalyticsMetricQuery } =
  vi.hoisted(() => ({
    useDashboardOverviewQuery: vi.fn(),
    useDashboardAttentionQuery: vi.fn(),
    useAnalyticsMetricQuery: vi.fn(),
  }));

vi.mock('@/features/home/services/dashboard', () => ({
  useDashboardOverviewQuery,
  useDashboardAttentionQuery,
}));

vi.mock('@/features/analytics/services/analytics', () => ({
  useAnalyticsMetricQuery,
  useAnalyticsMetricQueries: vi.fn(),
  useAnalyticsRegionsQuery: vi.fn(),
}));

vi.setConfig({ testTimeout: 20000 });

const money = (raw: number, display: string, short = display) => ({
  raw,
  display,
  short_display: short,
  currency: { code: 'USD', symbol: '$' },
});

const moneyKpi = (raw: number, display: string, short = display) => ({
  current: raw,
  current_money_object: money(raw, display, short),
  previous: null,
  previous_money_object: null,
  change: 12.5,
  series: [],
});

const countKpi = (current: number) => ({ current, previous: null, change: 3, series: [] });

const kpis = {
  gross_sales: moneyKpi(500, '$500.00'),
  orders: countKpi(12),
  average_order_value: moneyKpi(40, '$40.00'),
  returning_customer_rate: countKpi(25),
  net_sales: moneyKpi(18000, '$18,000.00', '$18K'),
  total_sales: moneyKpi(20345, '$20,345.00', '$20.3K'),
  items_ordered: countKpi(31),
  discounts: moneyKpi(10, '$10.00'),
  new_customers: countKpi(4),
  customers: countKpi(9),
  shipping_charges: moneyKpi(30, '$30.00'),
};

const attention = {
  to_ship: { count: 3, late_count: 1 },
  to_collect: { count: 0, base_total_money_object: money(0, '$0.00') },
  out_of_stock: { count: 2 },
  low_stock: {
    total: 2,
    items: [
      {
        variant_id: 7,
        product_id: 3,
        product_name: 'Mug',
        variant_name: 'Blue',
        image: null,
        available_quantity: 1,
      },
      {
        variant_id: 8,
        product_id: 4,
        product_name: 'Cap',
        variant_name: '',
        image: null,
        available_quantity: 4,
      },
    ],
  },
};

const products = [
  {
    product_id: 3,
    name: 'Heavy hoodie',
    image: null,
    is_deleted: false,
    units_sold: 5,
    net_sales_money_object: money(3134, '$3,134.00', '$3.1K'),
    availability_status: 'in_stock',
    track_inventory: true,
    inventory: 59,
  },
];

const query = (data: unknown, state: Record<string, unknown> = {}) => ({
  data,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
  ...state,
});

const mockData = () => {
  useDashboardOverviewQuery.mockReturnValue(query({ recent_orders: [] }));
  useDashboardAttentionQuery.mockReturnValue(query(attention));
  useAnalyticsMetricQuery.mockImplementation((key: string) =>
    key === 'kpis'
      ? query({ meta: {}, data: kpis })
      : query({ meta: {}, data: { items: products } }),
  );
};

const saveLayout = (layout: Partial<HomeLayout>) => {
  window.localStorage.setItem(
    HOME_LAYOUT_STORAGE_KEY,
    JSON.stringify({ ...DEFAULT_HOME_LAYOUT, ...layout }),
  );
};

const Harness = ({ onCustomize }: { onCustomize: () => void }) => {
  const layoutControls = useHomeLayout();

  return <HomeSections layoutControls={layoutControls} onCustomize={onCustomize} />;
};

const renderSections = (onCustomize = vi.fn()) => {
  const client = new QueryClient();

  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Harness onCustomize={onCustomize} />
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>,
  );

  return onCustomize;
};

const sectionOrder = () =>
  screen
    .getAllByTestId(/^home-section-/)
    .map((section) => [
      section.getAttribute('data-testid')?.replace('home-section-', ''),
      section.getAttribute('data-span'),
    ]);

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  mockData();
});

afterEach(() => {
  cleanup();
});

describe('HomeSections', () => {
  it('shows the default sections in order, with a lone section at full width', () => {
    renderSections();

    expect(sectionOrder()).toEqual([
      ['key_numbers', 'full'],
      ['recent_orders', 'half'],
      ['top_products', 'half'],
      ['needs_attention', 'full'],
    ]);
  });

  it('shows the key numbers with no comparison, in the Analytics amount format', () => {
    renderSections();

    const numbers = screen.getByTestId('home-key-numbers');

    expect(within(numbers).getByText('Total sales')).toBeInTheDocument();
    expect(within(numbers).getByText('$20.3K')).toHaveAttribute('title', '$20,345.00');
    expect(within(numbers).getByText('31')).toBeInTheDocument();
    expect(within(numbers).queryByText(/%/)).not.toBeInTheDocument();
    expect(within(numbers).queryByText('Gross sales')).not.toBeInTheDocument();
  });

  it('asks Analytics for the period with no comparison', () => {
    saveLayout({ period: 'week' });
    renderSections();

    expect(useAnalyticsMetricQuery).toHaveBeenCalledWith(
      'kpis',
      expect.objectContaining({ range: 'week_to_date', compare: 'none' }),
      true,
    );
    expect(useAnalyticsMetricQuery).toHaveBeenCalledWith(
      'sales_by_product',
      expect.objectContaining({ range: 'week_to_date', compare: 'none' }),
      true,
    );
  });

  it('shows the net sales, units sold and stock of the top products', () => {
    renderSections();

    expect(screen.getByText('$3.1K')).toHaveAttribute('title', '$3,134.00');
    expect(screen.getByText('59 left in stock')).toBeInTheDocument();
    expect(screen.getByText(/units? sold$/)).toBeInTheDocument();
  });

  it('lists the checks that need work first, and links them to their lists', () => {
    renderSections();

    const card = screen.getByTestId('home-section-needs_attention');

    expect(within(card).getByText('2 of 3 need you')).toBeInTheDocument();
    expect(
      within(card)
        .getAllByTestId(/^attention-/)
        .map((row) => row.getAttribute('data-testid')),
    ).toEqual(['attention-to_ship', 'attention-out_of_stock', 'attention-to_collect']);
    expect(within(card).getByText('1 waiting over 2 days')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('attention-to_collect')).getByText('Clear'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('attention-to_ship')).toHaveAttribute(
      'href',
      '/orders?attention=to_ship',
    );
    expect(screen.getByTestId('attention-out_of_stock')).toHaveAttribute(
      'href',
      '/inventory?inventory_type=out_of_stock',
    );
  });

  it('reads All caught up when nothing needs work', () => {
    useDashboardAttentionQuery.mockReturnValue(
      query({
        ...attention,
        to_ship: { count: 0, late_count: 0 },
        out_of_stock: { count: 0 },
      }),
    );
    renderSections();

    expect(screen.getByText('All caught up')).toBeInTheDocument();
    expect(screen.getAllByText('Clear')).toHaveLength(3);
  });

  it('lists the low-stock variants in Restock soon when it is on', () => {
    saveLayout({
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({ ...item, visible: true })),
    });
    renderSections();

    const card = screen.getByTestId('home-section-restock_soon');

    expect(within(card).getByText('Mug')).toBeInTheDocument();
    expect(within(card).getByText('1 left')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Mug/ })).toHaveAttribute('href', '/inventory/7');
    expect(within(card).getByRole('link', { name: 'View inventory' })).toHaveAttribute(
      'href',
      '/inventory?inventory_type=low_stock',
    );
  });

  it('shows the Restock soon empty state', () => {
    saveLayout({
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({ ...item, visible: true })),
    });
    useDashboardAttentionQuery.mockReturnValue(
      query({ ...attention, low_stock: { total: 0, items: [] } }),
    );
    renderSections();

    expect(screen.getByText('Nothing is low on stock.')).toBeInTheDocument();
  });

  it('does not ask for the attention data when its sections are off', () => {
    saveLayout({
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({
        ...item,
        visible: item.key === 'key_numbers',
      })),
    });
    renderSections();

    expect(useDashboardAttentionQuery).toHaveBeenCalledWith(false);
    expect(useDashboardOverviewQuery).toHaveBeenCalledWith(false);
  });

  it('shows an error in place of one section and still renders the others', () => {
    useAnalyticsMetricQuery.mockImplementation((key: string) =>
      key === 'kpis'
        ? query(undefined, { isError: true })
        : query({ meta: {}, data: { items: products } }),
    );
    renderSections();

    expect(
      within(screen.getByTestId('home-section-key_numbers')).getByText('Something went wrong'),
    ).toBeInTheDocument();
    expect(screen.getByText('Heavy hoodie')).toBeInTheDocument();
  });

  it('shows the empty state when every section is hidden', () => {
    saveLayout({
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({ ...item, visible: false })),
    });
    const onCustomize = renderSections();

    fireEvent.click(screen.getByRole('button', { name: 'Customize Home' }));

    expect(screen.getByText(/Every section is hidden\./)).toBeInTheDocument();
    expect(onCustomize).toHaveBeenCalled();
  });

  it('shows a prompt when no key number is chosen', () => {
    saveLayout({ kpis: DEFAULT_HOME_LAYOUT.kpis.map((item) => ({ ...item, visible: false })) });
    const onCustomize = renderSections();

    fireEvent.click(screen.getByRole('button', { name: 'Customize' }));

    expect(screen.getByText('No key numbers chosen.')).toBeInTheDocument();
    expect(onCustomize).toHaveBeenCalled();
  });

  it('hides a section from its menu', () => {
    renderSections();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions for Recent orders' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide from page' }));

    expect(screen.queryByTestId('home-section-recent_orders')).not.toBeInTheDocument();
    const { result } = renderHook(() => useHomeLayout());

    act(() => undefined);
    expect(result.current.layout.sections[1]).toEqual({ key: 'recent_orders', visible: false });
  });
});
