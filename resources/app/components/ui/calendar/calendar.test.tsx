import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { endOfMonth, endOfWeek } from 'date-fns';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DateRangePresetKey, DateRangeValue } from '@/components/ui/calendar';
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  TimePicker,
} from '@/components/ui/calendar';
import { WEEK_STARTS_ON } from '@/libs/date';

const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const;

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

const getTimeField = (container: HTMLElement) => {
  const field = container.querySelector<HTMLInputElement>('input[type="time"]');

  if (!field) {
    throw new Error('time field not found');
  }

  return field;
};

const renderDatePicker = (value: Date | null) => {
  const onChange = vi.fn();

  render(<DatePicker value={value} onChange={onChange} placeholder="Pick a date" />);

  return { onChange };
};

const renderTimePicker = (initialValue: string | null, hourCycle: 12 | 24 = 24) => {
  const onChange = vi.fn();

  const Wrapper = () => {
    const [value, setValue] = useState<string | null>(initialValue);

    return (
      <TimePicker
        value={value}
        hourCycle={hourCycle}
        onChange={(nextValue) => {
          onChange(nextValue);
          setValue(nextValue);
        }}
      />
    );
  };

  const { container } = render(<Wrapper />);

  return { onChange, field: getTimeField(container) };
};

const chooseOption = (listName: string, optionName: string) => {
  const list = screen.getByRole('listbox', { name: listName });

  fireEvent.click(within(list).getByRole('option', { name: optionName }));
};

describe('DatePicker', () => {
  it('renders the placeholder when it has no value', () => {
    renderDatePicker(null);

    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a date');
  });

  it('renders the placeholder when the value is an invalid date', () => {
    renderDatePicker(new Date('not-a-date'));

    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a date');
  });

  it('emits a Date when a day is selected', async () => {
    const { onChange } = renderDatePicker(new Date(2026, 5, 10));

    fireEvent.click(screen.getByRole('combobox'));

    fireEvent.click(await screen.findByRole('button', { name: /June 3rd, 2026/ }));

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 5, 3));
  });
});

describe('TimePicker overlay', () => {
  it('emits HH:mm when an hour and a minute are chosen', () => {
    const { onChange, field } = renderTimePicker(null);

    fireEvent.click(field);

    chooseOption('Hour', '14');
    chooseOption('Minute', '30');

    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('keeps the overlay open after the first choice', () => {
    const { field } = renderTimePicker(null);

    fireEvent.click(field);
    chooseOption('Hour', '14');

    expect(screen.getByRole('listbox', { name: 'Minute' })).toBeInTheDocument();
  });

  it('offers every hour and every minute', () => {
    const { field } = renderTimePicker(null);

    fireEvent.click(field);

    expect(
      within(screen.getByRole('listbox', { name: 'Hour' })).getAllByRole('option'),
    ).toHaveLength(24);
    expect(
      within(screen.getByRole('listbox', { name: 'Minute' })).getAllByRole('option'),
    ).toHaveLength(60);
  });

  it('emits a 24-hour string from a 12-hour selection', () => {
    const { onChange, field } = renderTimePicker(null, 12);

    fireEvent.click(field);

    chooseOption('Hour', '2');
    chooseOption('Minute', '30');
    chooseOption('Meridiem', 'PM');

    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('opens from the clock button', () => {
    renderTimePicker(null);

    fireEvent.click(screen.getByRole('button', { name: 'Choose time' }));

    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
  });

  it('stays open when focus moves into the field', () => {
    const { field } = renderTimePicker(null);

    fireEvent.click(screen.getByRole('button', { name: 'Choose time' }));
    fireEvent.focusIn(field);

    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
  });

  it('reopens when the field is clicked after being dismissed', () => {
    const { field } = renderTimePicker(null);

    fireEvent.click(field);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('listbox', { name: 'Hour' })).not.toBeInTheDocument();

    fireEvent.click(field);

    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
  });
});

describe('TimePicker field', () => {
  it('is a native time control holding the stored value', () => {
    const { field } = renderTimePicker('09:30');

    expect(field).toHaveValue('09:30');
  });

  it('emits the entered time', () => {
    const { onChange, field } = renderTimePicker(null);

    fireEvent.change(field, { target: { value: '14:30' } });

    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('emits nothing for an entry the control rejects', () => {
    const { onChange, field } = renderTimePicker('09:30');

    fireEvent.change(field, { target: { value: 'banana' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves a cleared field empty instead of restoring the old value', () => {
    const { field } = renderTimePicker('09:30');

    fireEvent.change(field, { target: { value: '' } });

    expect(field).toHaveValue('');
  });

  it('emits null when an emptied field loses focus', () => {
    const { onChange, field } = renderTimePicker('09:30');

    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);

    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe('DateRangePicker presets', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderRangePicker = (
    props: {
      presets?: boolean | DateRangePresetKey[];
      value?: DateRangeValue | null;
      minDate?: Date;
    } = {},
  ) => {
    const { value = null, ...rest } = props;
    const onChange = vi.fn();

    render(
      <DateRangePicker
        value={value}
        onChange={onChange}
        placeholder="Pick a date range"
        {...rest}
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));

    return { onChange };
  };

  const getPresetBar = () => document.querySelector('[data-slot="range-presets"]');

  const getPresetLabels = () => {
    const bar = getPresetBar();

    if (!bar) {
      return [];
    }

    return Array.from(bar.querySelectorAll('button')).map((button) => {
      return button.textContent;
    });
  };

  it('renders no preset bar by default', () => {
    renderRangePicker();

    expect(getPresetBar()).toBeNull();
    expect(screen.getAllByRole('grid')).not.toHaveLength(0);
  });

  it('renders the full set when presets is true', () => {
    renderRangePicker({ presets: true });

    expect(getPresetLabels()).toEqual([
      'Today',
      'Yesterday',
      'Tomorrow',
      'Last 7 days',
      'Last 30 days',
      'This week',
      'Last week',
      'This month',
      'Last month',
      'This year',
      'Last year',
    ]);
  });

  it('renders only the requested presets, in the requested order', () => {
    renderRangePicker({ presets: ['this-week', 'today'] });

    expect(getPresetLabels()).toEqual(['This week', 'Today']);
  });

  it('emits the preset range and closes the popover', () => {
    const { onChange } = renderRangePicker({ presets: ['today'] });

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 5, 10),
      to: new Date(2026, 5, 10),
    });
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
  });

  it('emits a week range honouring the calendar week start', () => {
    const { onChange } = renderRangePicker({ presets: ['last-week'] });

    fireEvent.click(screen.getByRole('button', { name: 'Last week' }));

    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 4, 31),
      to: endOfWeek(new Date(2026, 5, 3), weekOptions),
    });
  });

  it('disables a preset that falls entirely before minDate', () => {
    renderRangePicker({ presets: ['last-month'], minDate: new Date(2026, 5, 1) });

    expect(screen.getByRole('button', { name: 'Last month' })).toBeDisabled();
  });

  it('clamps a preset that only partly overlaps the bounds', () => {
    const { onChange } = renderRangePicker({
      presets: ['this-month'],
      minDate: new Date(2026, 5, 15),
    });

    fireEvent.click(screen.getByRole('button', { name: 'This month' }));

    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 5, 15),
      to: endOfMonth(new Date(2026, 5, 10)),
    });
  });

  it('marks the preset matching the current value as pressed', () => {
    renderRangePicker({
      presets: ['today', 'this-month'],
      value: { from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) },
    });

    expect(screen.getByRole('button', { name: 'This month' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('DateRangePicker range selection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const openRangePicker = () => {
    const onChange = vi.fn();

    render(
      <DateRangePicker
        value={null}
        onChange={onChange}
        placeholder="Pick a date range"
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));

    return { onChange };
  };

  const clickDay = (name: RegExp) => {
    fireEvent.click(screen.getByRole('button', { name }));
  };

  const getDayCell = (name: RegExp) => {
    return screen.getByRole('button', { name }).closest('[role="gridcell"]');
  };

  it('emits nothing and keeps the popover open when only the start day is picked', () => {
    const { onChange } = openRangePicker();

    clickDay(/June 3rd, 2026/);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('grid')).not.toHaveLength(0);
  });

  it('marks the start day while the end day is still missing', () => {
    openRangePicker();

    clickDay(/June 3rd, 2026/);

    expect(getDayCell(/June 3rd, 2026/)).toHaveAttribute('data-selected', 'true');
  });

  it('emits the range and closes the popover once the end day is picked', () => {
    const { onChange } = openRangePicker();

    clickDay(/June 3rd, 2026/);
    clickDay(/June 12th, 2026/);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 5, 3),
      to: new Date(2026, 5, 12),
    });
    expect(screen.queryAllByRole('grid')).toHaveLength(0);
  });

  it('commits a single day range when the popover closes with only a start day', () => {
    const { onChange } = openRangePicker();

    clickDay(/June 3rd, 2026/);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 5, 3),
      to: new Date(2026, 5, 3),
    });
  });

  it('commits a single day range when the start day is picked twice', () => {
    const { onChange } = openRangePicker();

    clickDay(/June 3rd, 2026/);
    clickDay(/June 3rd, 2026/);

    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 5, 3),
      to: new Date(2026, 5, 3),
    });
  });
});

describe('DateTimePicker', () => {
  it('combines an entered time with the selected date', () => {
    const onChange = vi.fn();

    const { container } = render(
      <DateTimePicker
        value={new Date(2026, 5, 3, 9, 0)}
        onChange={onChange}
        placeholder="Pick a date and time"
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(getTimeField(container.ownerDocument.body), {
      target: { value: '14:30' },
    });

    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 5, 3, 14, 30));
  });

  it('opens the time overlay without dismissing the calendar', () => {
    const { container } = render(
      <DateTimePicker
        value={new Date(2026, 5, 3, 9, 0)}
        onChange={vi.fn()}
        placeholder="Pick a date and time"
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(getTimeField(container.ownerDocument.body));

    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
