import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalyticsControls from '@/features/analytics/components/analytics-controls';
import { DEFAULT_LAYOUT } from '@/features/analytics/lib/layout';
import { type AnalyticsParams, DEFAULT_ANALYTICS_PARAMS } from '@/features/analytics/lib/url-state';

import { renderInRoot } from '../helpers';

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 14, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const renderControls = (params: Partial<AnalyticsParams> = {}) => {
  const onChange = vi.fn();

  renderInRoot(
    <AnalyticsControls
      params={{ ...DEFAULT_ANALYTICS_PARAMS, ...params }}
      onChange={onChange}
      layoutControls={{
        layout: DEFAULT_LAYOUT,
        setVisible: vi.fn(),
        move: vi.fn(),
        setAmounts: vi.fn(),
        reset: vi.fn(),
      }}
    />,
  );

  return { onChange };
};

const clickDay = (name: RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

const openDateControl = () => {
  fireEvent.click(screen.getByTestId('analytics-date-range'));
};

const openCompareControl = () => {
  fireEvent.click(screen.getByTestId('analytics-compare'));
};

const getPresetBar = () => {
  const bar = document.querySelector<HTMLElement>('[data-slot="range-presets"]');

  if (!bar) {
    throw new Error('preset bar not found');
  }

  return bar;
};

describe('Analytics date control', () => {
  it('shows the preset name and the dates in the trigger', () => {
    renderControls();

    const trigger = screen.getByTestId('analytics-date-range');

    expect(trigger).toHaveTextContent('Last 30 days');
    expect(trigger).toHaveTextContent('Sep 15 – Oct 14, 2026');
  });

  it('lists the analytics presets and the Custom item', () => {
    renderControls();
    openDateControl();

    const labels = Array.from(getPresetBar().querySelectorAll('button')).map((button) => {
      return button.textContent;
    });

    expect(labels).toEqual([
      'Today',
      'Yesterday',
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
      'Last 12 months',
      'Month to date',
      'Year to date',
      'Custom',
    ]);
  });

  it('applies a preset only after Apply', () => {
    const { onChange } = renderControls();
    openDateControl();

    fireEvent.click(within(getPresetBar()).getByRole('button', { name: 'Last 7 days' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Start' })).toHaveValue('Oct 8, 2026');
    expect(screen.getByText('7 days')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ range: 'last_7', from: null, to: null }),
    );
  });

  it('keeps the applied range on Cancel', () => {
    const { onChange } = renderControls();
    openDateControl();

    fireEvent.click(within(getPresetBar()).getByRole('button', { name: 'Last 7 days' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies custom days as a custom range and marks Custom', () => {
    const { onChange } = renderControls();
    openDateControl();

    clickDay(/September 7th, 2026/);
    clickDay(/September 15th, 2026/);

    expect(within(getPresetBar()).getByRole('button', { name: 'Custom' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('9 days')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ range: 'custom', from: '2026-09-07', to: '2026-09-15' }),
    );
  });

  it('does not allow a day after today', () => {
    renderControls();
    openDateControl();

    expect(screen.getByRole('button', { name: /October 15th, 2026/ })).toBeDisabled();
  });

  it('shows "Custom" in the trigger for an applied custom range', () => {
    renderControls({ range: 'custom', from: '2026-09-07', to: '2026-09-15' });

    const trigger = screen.getByTestId('analytics-date-range');

    expect(trigger).toHaveTextContent('Custom');
    expect(trigger).toHaveTextContent('Sep 7 – 15, 2026');
  });
});

describe('Analytics comparison control', () => {
  it('shows "Compare:" and the comparison dates in the trigger', () => {
    renderControls();

    const trigger = screen.getByTestId('analytics-compare');

    expect(trigger).toHaveTextContent('Compare:');
    expect(trigger).toHaveTextContent('Aug 16 – Sep 14, 2026');
  });

  it('shows "No comparison" in the trigger when comparison is off', () => {
    renderControls({ compare: 'none' });

    expect(screen.getByTestId('analytics-compare')).toHaveTextContent('No comparison');
  });

  it('shows the dates of Previous period and Previous year', () => {
    renderControls({ range: 'last_7' });
    openCompareControl();

    expect(screen.getByRole('button', { name: /Previous period/ })).toHaveTextContent(
      'Oct 1 – 7, 2026',
    );
    expect(screen.getByRole('button', { name: /Previous year/ })).toHaveTextContent(
      'Oct 8 – 14, 2025',
    );
  });

  it('shows the pending comparison range in the footer and applies it', () => {
    const { onChange } = renderControls();
    openCompareControl();

    expect(screen.getByText('Compared with Aug 16 – Sep 14, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Previous year/ }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Compared with Sep 15 – Oct 14, 2025')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ compare: 'previous_year', compare_from: null, compare_to: null }),
    );
  });

  it('applies No comparison with an empty footer', () => {
    const { onChange } = renderControls();
    openCompareControl();

    fireEvent.click(screen.getByRole('button', { name: 'No comparison' }));

    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ compare: 'none' }));
  });

  it('discards the pending option on Cancel', () => {
    const { onChange } = renderControls();
    openCompareControl();

    fireEvent.click(screen.getByRole('button', { name: 'No comparison' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens Custom at the previous period and applies the selected days', () => {
    const { onChange } = renderControls();
    openCompareControl();

    expect(screen.queryAllByRole('grid')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

    expect(screen.getByRole('textbox', { name: 'Start' })).toHaveValue('Aug 16, 2026');
    expect(screen.getByRole('textbox', { name: 'End' })).toHaveValue('Sep 14, 2026');

    clickDay(/September 7th, 2026/);
    clickDay(/September 15th, 2026/);

    expect(screen.getByText('Compared with Sep 7 – 15, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        compare: 'custom',
        compare_from: '2026-09-07',
        compare_to: '2026-09-15',
      }),
    );
  });

  it('disables Apply while the Custom range has no end', () => {
    renderControls();
    openCompareControl();

    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    clickDay(/September 7th, 2026/);

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});

describe('Analytics controls row', () => {
  it('opens the Customize sheet from the Customize button', () => {
    const { onChange } = renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'Customize' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Customize analytics' })).toBeInTheDocument();
  });

  it('has no currency control', () => {
    renderControls();

    expect(screen.queryByTestId('analytics-currency')).not.toBeInTheDocument();
  });
});
