import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Searchbox from '@/components/ui/searchbox';

const DELAY = 300;

const getInput = (container: HTMLElement) => {
  return container.querySelector('input')!;
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Searchbox', () => {
  it('keeps characters typed while the debounced value is still propagating', () => {
    vi.useFakeTimers();

    const onChange = vi.fn();
    const { container, rerender } = render(<Searchbox value="" onChange={onChange} delay={DELAY} />);

    fireEvent.change(getInput(container), { target: { value: 'a' } });

    act(() => {
      vi.advanceTimersByTime(DELAY);
    });

    expect(onChange).toHaveBeenCalledWith('a');

    fireEvent.change(getInput(container), { target: { value: 'ab' } });

    rerender(<Searchbox value="a" onChange={onChange} delay={DELAY} />);

    expect(getInput(container).value).toBe('ab');
  });

  it('accepts a value the parent changed on its own', () => {
    vi.useFakeTimers();

    const onChange = vi.fn();
    const { container, rerender } = render(<Searchbox value="" onChange={onChange} delay={DELAY} />);

    fireEvent.change(getInput(container), { target: { value: 'abc' } });

    act(() => {
      vi.advanceTimersByTime(DELAY);
    });

    rerender(<Searchbox value="abc" onChange={onChange} delay={DELAY} />);
    rerender(<Searchbox value="" onChange={onChange} delay={DELAY} />);

    expect(getInput(container).value).toBe('');
  });
});
