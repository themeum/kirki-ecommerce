import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import Button from '@/components/ui/button';
import CustomizeSheet from '@/features/analytics/components/customize-sheet';
import { STORAGE_KEY, useAnalyticsLayout } from '@/features/analytics/hooks/use-analytics-layout';
import { type AnalyticsLayout, CARD_KEYS, KPI_KEYS } from '@/features/analytics/lib/layout';

import { renderInRoot } from '../helpers';

const ROW_HEIGHT = 40;

const storedLayout = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as AnalyticsLayout;

const Harness = () => {
  const layoutControls = useAnalyticsLayout();

  return (
    <CustomizeSheet layoutControls={layoutControls}>
      <Button>Customize</Button>
    </CustomizeSheet>
  );
};

const openSheet = () => {
  renderInRoot(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Customize' }));

  return screen.getByRole('dialog', { name: 'Customize analytics' });
};

const groupList = (name: string) => screen.getByRole('list', { name });

const rowTestIds = (name: string) =>
  within(groupList(name))
    .getAllByRole('listitem')
    .map((row) => row.getAttribute('data-testid'));

const rectOf = (top: number, height: number) =>
  ({
    x: 0,
    y: top,
    top,
    left: 0,
    right: 300,
    bottom: top + height,
    width: 300,
    height,
    toJSON: () => ({}),
  }) as DOMRect;

const mockRowRects = () => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect(
    this: Element,
  ) {
    if (this.getAttribute('role') === 'list') {
      return rectOf(0, this.children.length * ROW_HEIGHT);
    }

    const row =
      this.parentElement?.getAttribute('role') === 'list'
        ? this
        : this.closest('[role="listitem"]')?.parentElement;

    if (!row?.parentElement) {
      return rectOf(0, 2000);
    }

    return rectOf(Array.from(row.parentElement.children).indexOf(row) * ROW_HEIGHT, ROW_HEIGHT);
  });
};

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const dragWithKeyboard = async (handleName: string, key: 'ArrowUp' | 'ArrowDown') => {
  const handle = screen.getByRole('button', { name: handleName });

  act(() => handle.focus());
  fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
  await flush();
  fireEvent.keyDown(document, { code: key, key });
  await flush();
  fireEvent.keyDown(document, { code: 'Space', key: ' ' });
  await flush();
};

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CustomizeSheet', () => {
  // Scenario: Open the sheet
  it('lists the 11 key metrics and the 15 cards with the default checks', () => {
    openSheet();

    const kpis = within(groupList('Key metrics')).getAllByRole('checkbox');
    const cards = within(groupList('Cards')).getAllByRole('checkbox');

    expect(groupList('Key metrics')).toHaveAttribute('data-slot', 'stacked-items');
    expect(groupList('Cards')).toHaveAttribute('data-slot', 'stacked-items');
    expect(kpis).toHaveLength(KPI_KEYS.length);
    expect(cards).toHaveLength(CARD_KEYS.length);
    expect(
      kpis.filter((checkbox) => checkbox.getAttribute('data-state') === 'checked'),
    ).toHaveLength(4);
    expect(cards.every((checkbox) => checkbox.getAttribute('data-state') === 'checked')).toBe(true);
    expect(
      within(groupList('Key metrics')).getByRole('checkbox', { name: 'Net sales' }),
    ).not.toBeChecked();
  });

  it('shows the help texts with the number of key metrics that are on', () => {
    const sheet = openSheet();

    expect(
      within(sheet).getByText(
        'Shown across the top, 4 in each row, in this order. 4/11 on. Drag to reorder.',
      ),
    ).toBeInTheDocument();
    expect(within(sheet).getByText('Shown in this order. Drag to reorder.')).toBeInTheDocument();

    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Net sales' }));

    expect(within(sheet).getByText(/5\/11 on/)).toBeInTheDocument();
  });

  // Scenario: Full width note
  it('shows Full width only on the full cards', () => {
    openSheet();

    const notes = within(groupList('Cards'))
      .getAllByText('Full width')
      .map((note) => note.closest('[role="listitem"]')?.getAttribute('data-testid'));

    expect(notes).toEqual([
      'customize-item-total_sales_over_time',
      'customize-item-orders_by_time_of_day',
      'customize-item-sales_by_location',
    ]);
  });

  // Scenario: All key metrics on
  it('allows all 11 key metrics on with no checkbox disabled', () => {
    const sheet = openSheet();

    [
      'Net sales',
      'Total sales',
      'Items ordered',
      'Discounts',
      'New customers',
      'Customers',
      'Shipping charges',
    ].forEach((name) => {
      fireEvent.click(within(groupList('Key metrics')).getByRole('checkbox', { name }));
    });

    expect(within(sheet).getByText(/11\/11 on/)).toBeInTheDocument();

    const kpis = within(groupList('Key metrics')).getAllByRole('checkbox');

    expect(kpis.every((checkbox) => checkbox.getAttribute('data-state') === 'checked')).toBe(true);
    expect(kpis.some((checkbox) => checkbox.hasAttribute('disabled'))).toBe(false);
  });

  // Scenario: Hide a card
  it('turns a card off', () => {
    const sheet = openSheet();

    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Sales by coupon code' }));

    expect(within(sheet).getByRole('checkbox', { name: 'Sales by coupon code' })).not.toBeChecked();
    expect(storedLayout().cards.find((item) => item.key === 'sales_by_coupon_code')?.visible).toBe(
      false,
    );
  });

  // Scenario: Last key metric / Other group not affected
  it('disables the checkbox of the last key metric that is on, and not the cards', () => {
    const sheet = openSheet();

    ['Gross sales', 'Average order value', 'Returning customer rate'].forEach((name) => {
      fireEvent.click(within(sheet).getByRole('checkbox', { name }));
    });

    expect(within(sheet).getByRole('checkbox', { name: 'Orders' })).toBeDisabled();
    expect(
      within(groupList('Cards'))
        .getAllByRole('checkbox')
        .every((checkbox) => !checkbox.hasAttribute('disabled')),
    ).toBe(true);
  });

  it('names each drag handle after its item', () => {
    openSheet();

    expect(screen.getByRole('button', { name: 'Reorder Gross sales' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Inventory health' })).toBeInTheDocument();
  });

  // Scenario: Keyboard reorder
  it('moves Orders above Gross sales with the keyboard', async () => {
    mockRowRects();
    openSheet();

    await dragWithKeyboard('Reorder Orders', 'ArrowUp');

    expect(
      storedLayout()
        .kpis.slice(0, 2)
        .map((item) => item.key),
    ).toEqual(['orders', 'gross_sales']);
    expect(rowTestIds('Key metrics').slice(0, 2)).toEqual([
      'customize-item-orders',
      'customize-item-gross_sales',
    ]);
    expect(storedLayout().cards.map((item) => item.key)).toEqual(CARD_KEYS);
  });

  // Scenario: No move between groups
  it('keeps the last key metric in its group when it is moved down', async () => {
    mockRowRects();
    openSheet();

    await dragWithKeyboard('Reorder Shipping charges', 'ArrowDown');

    expect(storedLayout().kpis.map((item) => item.key)).toEqual(KPI_KEYS);
    expect(storedLayout().cards.map((item) => item.key)).toEqual(CARD_KEYS);
    expect(rowTestIds('Cards')).toHaveLength(CARD_KEYS.length);
  });

  // Scenario: Reset
  it('applies the default layout on Reset to default', () => {
    const sheet = openSheet();

    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Sales by product' }));
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Net sales' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Reset to default' }));

    expect(within(sheet).getByRole('checkbox', { name: 'Sales by product' })).toBeChecked();
    expect(within(sheet).getByRole('checkbox', { name: 'Net sales' })).not.toBeChecked();
  });

  it('shows the Amounts group below Cards, with only the names before the example loads', () => {
    const sheet = openSheet();
    const headings = within(sheet)
      .getAllByRole('heading')
      .map((heading) => heading.textContent);

    expect(headings.slice(-2)).toEqual(['Cards', 'Amounts']);
    expect(within(sheet).getByRole('radio', { name: 'Short' })).toBeChecked();
    expect(within(sheet).getByRole('radio', { name: 'Long' })).not.toBeChecked();
  });

  it('saves the selected amount format', () => {
    const sheet = openSheet();

    fireEvent.click(within(sheet).getByRole('radio', { name: 'Long' }));

    expect(storedLayout().amounts).toBe('long');
  });

  // Scenario: Done
  it('closes on Done and keeps the changes', () => {
    const sheet = openSheet();

    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Taxes collected by region' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(storedLayout().cards.find((item) => item.key === 'taxes_by_region')?.visible).toBe(
      false,
    );
  });
});
