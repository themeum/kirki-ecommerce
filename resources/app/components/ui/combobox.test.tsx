import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import Combobox, { type ComboboxOption } from '@/components/ui/combobox';

afterEach(cleanup);

const LIST_HEIGHT = 240;
const VIEWPORT_ROWS = Math.ceil(LIST_HEIGHT / 32);

beforeAll(() => {
  // jsdom has no layout engine, so @tanstack/react-virtual's element-size
  // reads (offsetWidth/offsetHeight) are always 0. The component's
  // `initialRect` only covers the first render — once the list mounts, the
  // virtualizer measures the real element and would collapse to zero rows.
  // Stub the size so it behaves as it would in a real browser.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: LIST_HEIGHT,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 320,
  });
});

const countryOptions: ComboboxOption[] = [
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'NP', label: 'Nepal' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'US', label: 'United States' },
  { value: 'ZW', label: 'Zimbabwe' },
];

const buildOptions = (count: number): ComboboxOption[] => {
  return Array.from({ length: count }, (_, index) => ({
    value: `option-${index}`,
    label: `Option ${index}`,
  }));
};

const openCombobox = (props: Partial<Parameters<typeof Combobox>[0]> = {}) => {
  const onChange = vi.fn();

  const result = render(<Combobox options={countryOptions} onChange={onChange} {...props} />);

  fireEvent.click(screen.getByRole('combobox'));

  return { ...result, onChange };
};

const search = (query: string) => {
  fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: query } });
};

const renderedLabels = () => {
  return screen.getAllByRole('option').map((option) => option.textContent?.trim());
};

describe('Combobox virtualized rendering', () => {
  it('mounts only a slice of a long list while the scroll extent covers all of it', () => {
    openCombobox({ options: buildOptions(300), virtualized: true });

    const rows = screen.getAllByRole('option');

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(50);

    const sizer = rows[0].closest('[data-index]')?.parentElement;

    expect(sizer).toHaveStyle({ height: `${300 * 32}px` });
  });

  it('renders every option when the caller has not opted in', () => {
    openCombobox({ options: buildOptions(300) });

    expect(screen.getAllByRole('option')).toHaveLength(300);
  });

  it('keeps an overscan buffer mounted past the viewport for keyboard traversal', () => {
    openCombobox({ options: buildOptions(300), virtualized: true });

    const mountedIndexes = screen
      .getAllByRole('option')
      .map((option) => Number(option.closest('[data-index]')?.getAttribute('data-index')));

    // cmdk moves selection between mounted rows only, so rows must exist below
    // the fold for an arrow key to land on before its scroll mounts the next
    // batch.
    expect(Math.max(...mountedIndexes)).toBeGreaterThan(VIEWPORT_ROWS);
  });

  it('moves selection with the arrow keys', () => {
    openCombobox({ options: buildOptions(300), virtualized: true });

    const input = screen.getByPlaceholderText('Search...');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(screen.getAllByRole('option').filter((o) => o.getAttribute('aria-selected') === 'true'))
      .toHaveLength(1);
  });

  it('mounts later rows as the list scrolls', () => {
    openCombobox({ options: buildOptions(300), virtualized: true });

    const list = document.querySelector<HTMLElement>('[cmdk-list]')!;

    Object.defineProperty(list, 'scrollTop', { configurable: true, writable: true, value: 3000 });
    fireEvent.scroll(list);

    const mountedIndexes = screen
      .getAllByRole('option')
      .map((option) => Number(option.closest('[data-index]')?.getAttribute('data-index')));

    // Regression guard: Radix mounts the popover content in its own commit,
    // so a plain ref object leaves the virtualizer unsubscribed from scroll.
    // The first page still paints from `initialRect`, which makes the bug look
    // like "the list just stops partway down" rather than an obvious failure.
    expect(Math.min(...mountedIndexes)).toBeGreaterThan(50);
    expect(screen.getByText(`Option ${Math.min(...mountedIndexes)}`)).toBeInTheDocument();
  });

  it('resets the scroll offset when the query changes', () => {
    const { container } = openCombobox({ options: buildOptions(300), virtualized: true });

    const list = container.ownerDocument.querySelector<HTMLElement>('[cmdk-list]')!;
    list.scrollTop = 400;

    search('Option 2');

    expect(list.scrollTop).toBe(0);
  });
});

describe('Combobox search parity', () => {
  it('returns the same matches in the same order in both modes', () => {
    openCombobox({ virtualized: true });
    search('uk');
    const virtualizedLabels = renderedLabels();

    cleanup();

    openCombobox();
    search('uk');
    const defaultLabels = renderedLabels();

    expect(virtualizedLabels).toEqual(defaultLabels);
  });

  it('keeps fuzzy subsequence matching, which a plain substring match would lose', () => {
    openCombobox({ virtualized: true });

    search('uk');

    const labels = renderedLabels();

    // "United Kingdom" contains no "uk" substring — it matches only because
    // cmdk's scorer walks subsequences. This is the guard against the filter
    // silently degrading to `includes()`.
    expect(labels).toContain('United Kingdom');
    // A literal prefix still outranks that acronym match.
    expect(labels[0]).toBe('Ukraine');
  });

  it('matches on a plain substring', () => {
    openCombobox({ virtualized: true });

    search('bel');

    expect(renderedLabels()).toEqual(['Belgium']);
  });

  it('shows the empty message and no rows when nothing matches', () => {
    openCombobox({ virtualized: true });

    search('zzzzzz');

    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('shows every option again when the query is cleared', () => {
    openCombobox({ virtualized: true });

    search('uk');
    search('');

    expect(renderedLabels()).toEqual(countryOptions.map((option) => option.label));
  });
});

describe('Combobox leading icons', () => {
  const iconOptions: ComboboxOption[] = [
    { value: 'BD', label: 'Bangladesh', leftIcon: <span data-testid="icon-BD">🇧🇩</span> },
    { value: 'BE', label: 'Belgium', leftIcon: <span data-testid="icon-BE">🇧🇪</span> },
    { value: 'XX', label: 'No Flag Land' },
  ];

  it('renders the icon in the option row', () => {
    openCombobox({ options: iconOptions, virtualized: true });

    expect(screen.getByTestId('icon-BD')).toBeInTheDocument();
  });

  it('renders the icon on the closed trigger for the selected option', () => {
    render(<Combobox options={iconOptions} value="BD" onChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');

    expect(trigger).toHaveTextContent('Bangladesh');
    expect(trigger.querySelector('[data-testid="icon-BD"]')).toBeInTheDocument();
  });

  it('renders the icon inside a multi-select chip', () => {
    render(<Combobox options={iconOptions} multiple value={['BE']} onChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');

    expect(trigger.querySelector('[data-testid="icon-BE"]')).toBeInTheDocument();
  });

  it('still renders the label of an option that has no icon', () => {
    openCombobox({ options: iconOptions, virtualized: true });

    expect(screen.getByText('No Flag Land')).toBeInTheDocument();
  });

  it('reserves no icon slot when no option carries one', () => {
    const { container } = openCombobox({ options: countryOptions, virtualized: true });

    const firstRow = screen.getAllByRole('option')[0];

    // The check gutter plus the label, and nothing between them.
    expect(firstRow.children).toHaveLength(2);
    expect(container).toBeTruthy();
  });

  it('reserves the icon slot on every row once any option carries one', () => {
    openCombobox({ options: iconOptions, virtualized: true });

    const rowWithoutIcon = screen.getByText('No Flag Land').closest('[role="option"]');

    expect(rowWithoutIcon?.children).toHaveLength(3);
  });
});
