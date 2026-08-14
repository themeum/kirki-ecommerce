import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DatePicker, DateTimePicker, TimePicker } from '@/components/ui/calendar';

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

const renderDatePicker = (value: string | null) => {
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

  it('renders the placeholder when the value is unparseable', () => {
    renderDatePicker('not-a-date');

    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a date');
  });

  it('emits a yyyy-MM-dd string when a day is selected', async () => {
    const { onChange } = renderDatePicker('2026-06-10');

    fireEvent.click(screen.getByRole('combobox'));

    fireEvent.click(await screen.findByRole('button', { name: /June 3rd, 2026/ }));

    expect(onChange).toHaveBeenCalledWith('2026-06-03');
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

describe('DateTimePicker', () => {
  it('combines an entered time with the selected date', () => {
    const onChange = vi.fn();

    const { container } = render(
      <DateTimePicker
        value="2026-06-03 09:00"
        onChange={onChange}
        placeholder="Pick a date and time"
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(getTimeField(container.ownerDocument.body), {
      target: { value: '14:30' },
    });

    expect(onChange).toHaveBeenLastCalledWith('2026-06-03 14:30');
  });

  it('opens the time overlay without dismissing the calendar', () => {
    const { container } = render(
      <DateTimePicker
        value="2026-06-03 09:00"
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
