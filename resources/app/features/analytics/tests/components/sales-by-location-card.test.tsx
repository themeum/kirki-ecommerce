import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SalesByLocationCard from '@/features/analytics/components/cards/sales-by-location-card';
import type { AnalyticsCards } from '@/features/analytics/schemas/catalog/analytics';

import { buildOverview, country, locationRow } from '../fixtures';

const { useAnalyticsRegionsQuery } = vi.hoisted(() => ({ useAnalyticsRegionsQuery: vi.fn() }));

vi.mock('@/features/analytics/services/analytics', () => ({ useAnalyticsRegionsQuery }));

type CardProps = ComponentProps<typeof SalesByLocationCard>;

const cards = buildOverview().cards as unknown as AnalyticsCards;
const params = { range: 'last_30', compare: 'previous_period' } as CardProps['params'];
const refetch = vi.fn();

const regions = {
  country: 'US',
  sales: [
    { name: 'New York', ...locationRow(509562, 50, 43, [17.1, 4.2, 4.9]) },
    { name: 'California', ...locationRow(477716, 59, 54, [6.7, 20.4, 20]) },
  ],
  orders: [
    { name: 'California', ...locationRow(477716, 59, 54, [6.7, 20.4, 20]) },
    { name: 'New York', ...locationRow(509562, 50, 43, [17.1, 4.2, 4.9]) },
  ],
  customers: [{ name: 'California', ...locationRow(477716, 59, 54, [6.7, 20.4, 20]) }],
};

const mockRegions = (state: Record<string, unknown>) => {
  useAnalyticsRegionsQuery.mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch,
    ...state,
  });
};

const renderCard = (overrides: Partial<CardProps> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const props: CardProps = {
    data: cards.sales_by_location,
    isEmpty: false,
    formatMinor: String,
    formatMinorShort: String,
    range: { from: '2026-09-15', to: '2026-10-14' },
    compareRange: { from: '2026-08-16', to: '2026-09-14' },
    params,
    ...overrides,
  };
  const view = render(
    <QueryClientProvider client={client}>
      <SalesByLocationCard {...props} />
    </QueryClientProvider>,
  );

  return {
    ...view,
    rerenderWith: (next: Partial<CardProps>) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <SalesByLocationCard {...props} {...next} />
        </QueryClientProvider>,
      ),
  };
};

const listLabels = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');

const findCountry = async (name: RegExp) => screen.findByRole('button', { name });

const lastRegionsCountry = () => {
  const calls = useAnalyticsRegionsQuery.mock.calls as unknown[][];

  return calls[calls.length - 1]?.[1];
};

beforeEach(() => {
  useAnalyticsRegionsQuery.mockReset();
  refetch.mockReset();
  mockRegions({ isPending: true });
});

afterEach(cleanup);

describe('Sales by location card', () => {
  // Scenario: Top countries
  it('lists the top 5 countries by Net sales, the first with a full bar', () => {
    renderCard();

    const labels = listLabels();

    expect(labels).toHaveLength(5);
    expect(labels[0]).toMatch(/^United States\$19\.9K/);
    expect(screen.getAllByTitle('$19913.57')[0]).toHaveTextContent('$19.9K');
    expect(labels.map((label) => label.split('$')[0])).toEqual([
      'United States',
      'Germany',
      'Australia',
      'Canada',
      'Bangladesh',
    ]);
    expect(screen.getAllByRole('listitem')[0].querySelector('[style]')).toHaveStyle({
      width: '100%',
    });
    expect(lastRegionsCountry()).toBeNull();
  });

  // Scenario: Color by tab
  it('colors the map and orders the list by the selected tab', async () => {
    renderCard();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Customers' }), { button: 0 });

    const unitedStates = await findCountry(/^United States · 207$/);
    const bangladesh = await findCountry(/^Bangladesh · 12$/);
    const legend = within(screen.getByTestId('location-legend'));

    expect(unitedStates.getAttribute('fill')).toContain(' 100%,');
    expect(bangladesh.getAttribute('fill')).toContain(' 22%,');
    expect(legend.getByText('Customers')).toBeInTheDocument();
    expect(legend.getByText('2')).toBeInTheDocument();
    expect(legend.getByText('207')).toBeInTheDocument();
    expect(legend.getByText('None')).toBeInTheDocument();
    expect(listLabels()[0]).toMatch(/^United States207/);
  });

  // Scenario: Hover a country with no value
  it('shows a border and a No data tooltip on a country with no value, and does nothing on a click', async () => {
    const { container } = renderCard();

    await findCountry(/^Germany · /);

    const france = container.querySelector('path[data-country="250"]');

    expect(france).not.toHaveAttribute('role');
    expect(france).not.toHaveAttribute('tabindex');
    fireEvent.mouseMove(france!);

    expect(screen.getByTestId('choropleth-outline')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('FranceNo data');

    fireEvent.click(france!);

    expect(lastRegionsCountry()).toBeNull();
    expect(screen.queryByTestId('regions-heading')).not.toBeInTheDocument();

    fireEvent.mouseLeave(france!);

    expect(screen.queryByTestId('choropleth-outline')).not.toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Scenario: Hover a country
  it('shows a border and a tooltip with the value and the change on hover', async () => {
    renderCard();

    const germany = await findCountry(/^Germany · \$5\.7K$/);

    fireEvent.mouseMove(germany);

    expect(screen.getByTestId('choropleth-outline')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Germany$5.7K111.2%');

    fireEvent.mouseLeave(germany);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // Scenario: Select a country
  it('zooms to a clicked country, fades the others and lists its regions', async () => {
    mockRegions({ data: regions });
    renderCard();

    fireEvent.click(await findCountry(/^United States · /));

    expect(lastRegionsCountry()).toBe('US');
    expect(screen.getByTestId('regions-heading')).toHaveTextContent('United States by region');
    expect(screen.getByRole('button', { name: '← All countries' })).toBeInTheDocument();
    expect(listLabels().map((label) => label.split('$')[0])).toEqual(['New York', 'California']);
    expect(screen.getByTestId('choropleth-zoom').style.transform).not.toContain('scale(1)');
    expect((await findCountry(/^Germany · /)).getAttribute('opacity')).toBe('0.35');
    expect((await findCountry(/^United States · /)).getAttribute('opacity')).toBe('1');
  });

  it('selects a country from its list row and with the keyboard', async () => {
    mockRegions({ data: regions });
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /^Canada/ }));

    expect(lastRegionsCountry()).toBe('CA');

    fireEvent.click(screen.getByRole('button', { name: '← All countries' }));
    fireEvent.keyDown(await findCountry(/^Germany · /), { key: 'Enter' });

    expect(lastRegionsCountry()).toBe('DE');
  });

  // Scenario: Change tab in a country
  it('lists the regions by the new tab without a new request', async () => {
    mockRegions({ data: regions });
    renderCard();

    fireEvent.click(await findCountry(/^United States · /));
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Orders' }), { button: 0 });

    expect(listLabels().map((label) => label.split(/\d/)[0])).toEqual(['California', 'New York']);
    expect(
      new Set(useAnalyticsRegionsQuery.mock.calls.map((call) => (call as unknown[])[1])),
    ).toEqual(new Set([null, 'US']));
  });

  // Scenario: Back to all countries
  it('goes back to all countries on Escape, on the link and on a click on the sea', async () => {
    mockRegions({ data: regions });
    renderCard();

    fireEvent.click(await findCountry(/^United States · /));
    fireEvent.keyDown(screen.getByTestId('regions-heading'), { key: 'Escape' });

    expect(screen.queryByTestId('regions-heading')).not.toBeInTheDocument();
    expect(screen.getByTestId('choropleth-zoom').style.transform).toContain('scale(1)');

    fireEvent.click(await findCountry(/^United States · /));
    fireEvent.click(screen.getByRole('button', { name: '← All countries' }));

    expect(screen.queryByTestId('regions-heading')).not.toBeInTheDocument();

    fireEvent.click(await findCountry(/^United States · /));
    fireEvent.click(screen.getByTestId('choropleth-sea'));

    expect(screen.queryByTestId('regions-heading')).not.toBeInTheDocument();
  });

  it('selects a country that has no shape on the map without a zoom', async () => {
    const singapore = cards.sales_by_location.countries.filter((row) => row.code === 'SG');

    mockRegions({ data: { ...regions, country: 'SG' } });
    renderCard({ data: { countries: singapore } });

    expect(await screen.findByTestId('choropleth-zoom')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Singapore/ }));

    expect(lastRegionsCountry()).toBe('SG');
    expect(screen.getByTestId('regions-heading')).toHaveTextContent('Singapore by region');
    expect(screen.getByTestId('choropleth-zoom').style.transform).toContain('scale(1)');
  });

  it('shows skeleton rows while the regions load, and a retry on an error', async () => {
    const { rerenderWith } = renderCard();

    fireEvent.click(await findCountry(/^United States · /));

    expect(screen.getByTestId('regions-loading')).toBeInTheDocument();

    mockRegions({ isError: true });
    rerenderWith({});
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));

    expect(refetch).toHaveBeenCalled();
  });

  // Scenario: Range change keeps the country / Range change clears the country
  it('keeps a selected country that still has a value after a range change, else clears it', async () => {
    mockRegions({ data: regions });
    const { rerenderWith } = renderCard();

    fireEvent.click(await findCountry(/^United States · /));

    const keeps = {
      countries: cards.sales_by_location.countries.filter((row) => row.code !== 'DE'),
    };

    rerenderWith({ data: keeps, params: { ...params, range: 'last_90' } });

    expect(screen.getByTestId('regions-heading')).toHaveTextContent('United States by region');
    expect(lastRegionsCountry()).toBe('US');

    const clears = {
      countries: cards.sales_by_location.countries.filter((row) => row.code !== 'US'),
    };

    rerenderWith({ data: clears });

    expect(screen.queryByTestId('regions-heading')).not.toBeInTheDocument();
    expect(lastRegionsCountry()).toBeNull();
  });

  it('shows no change when the comparison is None', () => {
    const plain = {
      countries: [country('US', '840', 'United States', locationRow(1000, 1, 1))],
    };

    renderCard({ data: plain, compareRange: null });

    expect(screen.queryByTestId('change-badge')).not.toBeInTheDocument();
  });

  it('shows the empty state when no country has a value', () => {
    renderCard({ data: { countries: [] }, isEmpty: true });

    expect(screen.getByTestId('card-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('choropleth-map')).not.toBeInTheDocument();
  });

  describe('row ripple', () => {
    const row = (name: string) =>
      screen
        .getAllByRole('button', { name: new RegExp(`^${name}`) })
        .find((element) => element.tagName === 'BUTTON')!;

    // Scenario: Hover a country row
    it('plays a ripple on the hovered country and shows no border or tooltip', async () => {
      renderCard();
      await findCountry(/^Germany · /);

      fireEvent.mouseEnter(row('Germany'));

      const ripple = screen.getByTestId('choropleth-ripple');

      expect(ripple).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByTestId('choropleth-outline')).not.toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.mouseLeave(row('Germany'));

      expect(screen.queryByTestId('choropleth-ripple')).not.toBeInTheDocument();
    });

    // Scenario: Hover the same row again
    it('plays the ripple again on a new hover of the same row', async () => {
      renderCard();
      await findCountry(/^Germany · /);

      fireEvent.mouseEnter(row('Germany'));
      const first = screen.getByTestId('choropleth-ripple');
      fireEvent.mouseLeave(row('Germany'));
      fireEvent.mouseEnter(row('Germany'));

      expect(screen.getByTestId('choropleth-ripple')).not.toBe(first);
    });

    // Scenario: Move to another row
    it('moves the ripple to the next hovered row', async () => {
      renderCard();
      await findCountry(/^Germany · /);

      fireEvent.mouseEnter(row('Germany'));
      const germany = screen.getByTestId('choropleth-ripple');
      fireEvent.mouseEnter(row('United States'));
      fireEvent.mouseLeave(row('Germany'));

      const unitedStates = screen.getByTestId('choropleth-ripple');

      expect(unitedStates).not.toBe(germany);
      expect(unitedStates.getAttribute('cx')).not.toBe(germany.getAttribute('cx'));
    });

    // Scenario: Keyboard focus on a country row
    it('plays the ripple on focus and removes it on blur', async () => {
      renderCard();
      await findCountry(/^Germany · /);

      fireEvent.focus(row('Germany'));

      expect(screen.getByTestId('choropleth-ripple')).toBeInTheDocument();

      fireEvent.blur(row('Germany'));

      expect(screen.queryByTestId('choropleth-ripple')).not.toBeInTheDocument();
    });

    // Scenario: Region row
    it('shows no ripple on a region row', async () => {
      mockRegions({ data: regions });
      renderCard();

      fireEvent.click(await findCountry(/^United States · /));
      fireEvent.mouseEnter(within(screen.getByRole('list')).getByText('California'));

      expect(screen.queryByTestId('choropleth-ripple')).not.toBeInTheDocument();
    });
  });
});
