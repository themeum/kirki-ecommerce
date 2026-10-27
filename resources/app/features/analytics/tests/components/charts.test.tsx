import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BarChart from '@/features/analytics/components/charts/bar-chart';
import {
  buildScale,
  getXLabelIndexes,
} from '@/features/analytics/components/charts/chart-geometry';
import ChoroplethMap from '@/features/analytics/components/charts/choropleth-map';
import HBarList from '@/features/analytics/components/charts/hbar-list';
import LineChart from '@/features/analytics/components/charts/line-chart';

import { renderInRoot } from '../helpers';

const points = [
  { date: '2026-10-02', label: 'Oct 2', value: 1500, previous_label: 'Sep 2', previous_value: 900 },
  {
    date: '2026-10-03',
    label: 'Oct 3',
    value: 3000,
    previous_label: 'Sep 3',
    previous_value: 2500,
  },
  { date: '2026-10-04', label: 'Oct 4', value: 0, previous_label: 'Sep 4', previous_value: 0 },
];

const withoutComparison = points.map(({ date, label, value }) => ({ date, label, value }));

const formatValue = (value: number) => `$${(value / 100).toFixed(2)}`;

const charts = [
  ['LineChart', LineChart],
  ['BarChart', BarChart],
] as const;

describe.each(charts)('%s tooltip', (_name, Chart) => {
  afterEach(cleanup);

  it('shows no tooltip until a point is hovered or focused', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders one focusable point for every data point', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    for (let index = 0; index < points.length; index += 1) {
      expect(screen.getByTestId(`chart-point-${index}`).tabIndex).toBeGreaterThanOrEqual(0);
    }
  });

  // Scenario: Hover a day
  it('shows the day, its value and the comparison day with its value on hover', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    fireEvent.pointerEnter(screen.getByTestId('chart-point-1'));
    fireEvent.mouseOver(screen.getByTestId('chart-point-1'));

    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).getByText('Oct 3')).toBeInTheDocument();
    expect(within(tooltip).getByText('$30.00')).toBeInTheDocument();
    expect(within(tooltip).getByText('Sep 3')).toBeInTheDocument();
    expect(within(tooltip).getByText('$25.00')).toBeInTheDocument();
  });

  it('shows the same on keyboard focus', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    act(() => screen.getByTestId('chart-point-0').focus());

    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).getByText('Oct 2')).toBeInTheDocument();
    expect(within(tooltip).getByText('$15.00')).toBeInTheDocument();
    expect(within(tooltip).getByText('Sep 2')).toBeInTheDocument();
    expect(within(tooltip).getByText('$9.00')).toBeInTheDocument();
  });

  it('hides the tooltip when the point loses hover or focus', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);
    const point = screen.getByTestId('chart-point-1');

    fireEvent.mouseOver(point);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseOut(point);
    fireEvent.pointerLeave(point);
    act(() => point.blur());

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows only the current value when there is no comparison', () => {
    renderInRoot(
      <Chart label="Total sales" points={withoutComparison} formatValue={formatValue} />,
    );

    act(() => screen.getByTestId('chart-point-1').focus());

    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).getByText('Oct 3')).toBeInTheDocument();
    expect(within(tooltip).getByText('$30.00')).toBeInTheDocument();
    expect(within(tooltip).queryByText('Sep 3')).not.toBeInTheDocument();
  });

  it('labels the chart for assistive technology', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    expect(screen.getByLabelText('Total sales')).toBeInTheDocument();
  });
});

describe.each(charts)('%s axes', (_name, Chart) => {
  afterEach(cleanup);

  it('draws at the measured width with no stretch', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    const svg = screen.getByLabelText('Total sales');

    expect(svg).toHaveAttribute('viewBox', '0 0 640 220');
    expect(svg).not.toHaveAttribute('preserveAspectRatio', 'none');
  });

  // Scenario: Money y-axis
  it('shows 5 y-axis values at round steps in the short form', () => {
    const sales = [70000, 35000, 0].map((value, index) => ({ ...points[index], value }));

    renderInRoot(
      <Chart
        label="Total sales"
        points={sales.map(({ date, label, value }) => ({ date, label, value }))}
        formatValue={formatValue}
        formatAxisValue={(value) => `$${value / 100}`}
      />,
    );

    const labels = within(screen.getByTestId('chart-y-axis')).getAllByText(/\$/);

    expect(labels.map((label) => label.textContent)).toEqual([
      '$0',
      '$250',
      '$500',
      '$750',
      '$1000',
    ]);
  });

  it('shows every x-axis label when they fit', () => {
    renderInRoot(<Chart label="Total sales" points={points} formatValue={formatValue} />);

    expect(within(screen.getByTestId('chart-x-axis')).getAllByText(/Oct/)).toHaveLength(3);
  });

  // Scenario: 13 weekly points
  it('labels every 2nd week from the first', () => {
    const weeks = Array.from({ length: 13 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, '0')}`,
      label: `W${index + 1}`,
      value: index,
    }));

    renderInRoot(<Chart label="Total sales" points={weeks} formatValue={formatValue} />);

    const labels = within(screen.getByTestId('chart-x-axis'))
      .getAllByText(/^W/)
      .map((label) => label.textContent);

    expect(labels).toEqual(['W1', 'W3', 'W5', 'W7', 'W9', 'W11', 'W13']);
  });

  // Scenario: Hover a week
  it('shows the span label of the point in the tooltip', () => {
    const groups = points.map((point) => ({
      ...point,
      span_label: `${point.label} – span`,
      previous_span_label: `${point.previous_label} – span`,
    }));

    renderInRoot(<Chart label="Total sales" points={groups} formatValue={formatValue} />);

    act(() => screen.getByTestId('chart-point-1').focus());

    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).getByText('Oct 3 – span')).toBeInTheDocument();
    expect(within(tooltip).getByText('Sep 3 – span')).toBeInTheDocument();
  });
});

describe('LineChart points', () => {
  afterEach(cleanup);

  it('shows the area and only the last point by default', () => {
    renderInRoot(<LineChart label="Total sales" points={points} formatValue={formatValue} />);

    expect(screen.queryAllByTestId('line-chart-point')).toHaveLength(0);
    expect(screen.getByTestId('line-chart-last-point')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart-area')).toBeInTheDocument();
  });

  // Scenario: Average order value over time
  it('shows a point on every current value and no area when set', () => {
    renderInRoot(
      <LineChart
        label="Average order value"
        points={points}
        formatValue={formatValue}
        showPoints
        showArea={false}
      />,
    );

    expect(screen.getAllByTestId('line-chart-point')).toHaveLength(points.length);
    expect(screen.queryByTestId('line-chart-area')).not.toBeInTheDocument();
  });
});

describe('BarChart previous bars', () => {
  afterEach(cleanup);

  it('shows a mark for the comparison by default', () => {
    renderInRoot(<BarChart label="Orders" points={points} formatValue={formatValue} />);

    expect(screen.queryAllByTestId('bar-chart-previous-bar')).toHaveLength(0);
  });

  // Scenario: Orders over time
  it('shows a rounded comparison bar beside each current bar when set', () => {
    renderInRoot(
      <BarChart label="Orders" points={points} formatValue={formatValue} showPreviousBars />,
    );

    const previous = screen.getAllByTestId('bar-chart-previous-bar');
    const current = screen.getAllByTestId('bar-chart-current-bar');

    expect(previous).toHaveLength(points.length);
    expect(current).toHaveLength(points.length);
    expect(Number(previous[0].getAttribute('x'))).toBeLessThan(
      Number(current[0].getAttribute('x')),
    );
    expect(current[0].getAttribute('rx')).toBe(
      String(Number(current[0].getAttribute('width')) / 2),
    );
  });
});

describe('BarChart stacked bars', () => {
  afterEach(cleanup);

  const stacked = points.map((point) => ({
    ...point,
    value: 5,
    segments: [3, 2],
    previous_value: 40,
    previous_segments: [30, 10],
  }));

  // Scenario: New vs returning customers
  it('draws the segments with no comparison mark and rounds only the top segment', () => {
    renderInRoot(
      <BarChart
        label="Customers"
        points={stacked}
        formatValue={String}
        segmentNames={['New', 'Returning']}
      />,
    );

    const segments = screen.getAllByTestId('bar-chart-segment');

    expect(segments).toHaveLength(stacked.length * 2);
    expect(segments[0].getAttribute('d')).not.toContain('A');
    expect(segments[1].getAttribute('d')).toContain('A');
    expect(screen.queryByTestId('bar-chart-previous-bar')).not.toBeInTheDocument();
  });

  it('scales the y-axis to the current totals only', () => {
    renderInRoot(<BarChart label="Customers" points={stacked} formatValue={String} />);

    const labels = within(screen.getByTestId('chart-y-axis'))
      .getAllByText(/^\d+$/)
      .map((label) => label.textContent);

    expect(labels).toEqual(['0', '2', '4', '6', '8']);
  });

  it('shows the comparison values in the tooltip on hover', () => {
    renderInRoot(
      <BarChart
        label="Customers"
        points={stacked}
        formatValue={String}
        segmentNames={['New', 'Returning']}
      />,
    );

    fireEvent.mouseOver(screen.getByTestId('chart-point-1'));

    const tooltip = screen.getByRole('tooltip');

    expect(within(tooltip).getByText('New: 3')).toBeInTheDocument();
    expect(within(tooltip).getByText('New: 30')).toBeInTheDocument();
  });
});

describe('buildScale', () => {
  it('uses round steps of 1, 2.5 or 5 from 0', () => {
    expect(buildScale([70000]).ticks).toEqual([0, 25000, 50000, 75000, 100000]);
    expect(buildScale([9800000]).ticks).toEqual([0, 2500000, 5000000, 7500000, 10000000]);
    expect(buildScale([1150]).ticks).toEqual([0, 500, 1000, 1500, 2000]);
  });

  it('uses whole steps of 1, 2 or 5 for small values', () => {
    expect(buildScale([7]).ticks).toEqual([0, 2, 4, 6, 8]);
    expect(buildScale([3]).ticks).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps a scale when every value is zero', () => {
    expect(buildScale([0, 0]).ticks).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('getXLabelIndexes', () => {
  const everyNth = (count: number, step: number) =>
    Array.from({ length: Math.ceil(count / step) }, (_, index) => index * step);

  // Scenario: 7 daily points
  it('labels every day of a 7-day range', () => {
    expect(getXLabelIndexes(7, 900)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  // Scenario: 30 daily points
  it('labels every 3rd day of a 30-day range', () => {
    expect(getXLabelIndexes(30, 1200)).toEqual(everyNth(30, 3));
  });

  // Scenario: 13 weekly points
  it('labels every 2nd week of 13 weeks', () => {
    expect(getXLabelIndexes(13, 1200)).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });

  // Scenario: 12 monthly points
  it('labels every month of 12 months', () => {
    expect(getXLabelIndexes(12, 1200)).toEqual(everyNth(12, 1));
  });

  // Scenario: 24 monthly points
  it('labels every 2nd month of 24 months', () => {
    expect(getXLabelIndexes(24, 1200)).toEqual(everyNth(24, 2));
  });

  // Scenario: Narrow card
  it('uses a larger equal step on a narrow card', () => {
    expect(getXLabelIndexes(30, 280)).toEqual([0, 8, 16, 24]);
  });
});

describe('HBarList highlight', () => {
  afterEach(cleanup);

  it('reports the hover and the focus of a selectable row', () => {
    const onHighlight = vi.fn();

    renderInRoot(
      <HBarList
        items={[
          { key: 'DE', label: 'Germany', value: 1, display: '1', onSelect: vi.fn(), onHighlight },
        ]}
      />,
    );

    const row = screen.getByRole('button', { name: /^Germany/ });

    fireEvent.mouseEnter(row);
    fireEvent.mouseLeave(row);
    fireEvent.focus(row);
    fireEvent.blur(row);

    expect(onHighlight.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it('gives a row with no select action no button', () => {
    renderInRoot(<HBarList items={[{ key: 'CA', label: 'California', value: 1, display: '1' }]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ChoroplethMap ripple', () => {
  afterEach(cleanup);

  const renderMap = (rippleNumericCode: string | null) =>
    renderInRoot(
      <QueryClientProvider client={new QueryClient()}>
        <ChoroplethMap
          label="Sales by location"
          areas={{}}
          selectedNumericCode={null}
          rippleNumericCode={rippleNumericCode}
          onSelect={vi.fn()}
        />
      </QueryClientProvider>,
    );

  it('draws a ring hidden from assistive technology for a country with a shape', async () => {
    renderMap('276');

    expect(await screen.findByTestId('choropleth-ripple')).toHaveAttribute('aria-hidden', 'true');
  });

  // Scenario: Country with no map shape
  it.each([['702'], [null]])('draws no ring for %s', async (code) => {
    renderMap(code);

    await screen.findByTestId('choropleth-sea');

    expect(screen.queryByTestId('choropleth-ripple')).not.toBeInTheDocument();
  });
});
