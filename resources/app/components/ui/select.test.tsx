import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const renderSelect = (triggerProps: Partial<Parameters<typeof SelectTrigger>[0]> = {}) => {
  return render(
    <Select value="usd">
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="usd">US Dollar</SelectItem>
      </SelectContent>
    </Select>,
  );
};

afterEach(() => {
  cleanup();
});

describe('SelectTrigger', () => {
  it('renders the clear control outside the trigger button', () => {
    renderSelect({ showClear: true, onClear: vi.fn() });

    const clear = screen.getByRole('button', { name: 'Clear selection' });
    const combobox = screen.getByRole('combobox');

    expect(clear).not.toBe(combobox);
    expect(combobox).not.toContainElement(clear);
    expect(clear.parentElement?.closest('button')).toBeNull();
  });

  it('clears without opening the dropdown', () => {
    const onClear = vi.fn();
    renderSelect({ showClear: true, onClear });

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).toHaveAttribute('data-state', 'closed');
  });

  it('shows the chevron and no clear control by default', () => {
    renderSelect();

    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="select-icon"]')).toBeInTheDocument();
  });
});
