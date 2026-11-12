import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Chip from '@/components/ui/chip/chip';
import ChipField from '@/components/ui/chip/chip-input';

const CHIPS = ['Hoodie', 'Sneakers', 'Headwear'];

const renderField = (props: { maxVisibleRows?: number; disabled?: boolean } = {}) =>
  render(
    <ChipField
      control={<input placeholder="Type here" disabled={props.disabled} />}
      chips={CHIPS.map((chip) => (
        <Chip key={chip} text={chip} />
      ))}
      {...props}
    />,
  );

const box = () => screen.getByPlaceholderText('Type here').closest('[role="presentation"]');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ChipField', () => {
  it('renders the chips before the control on one row', () => {
    renderField();

    const input = screen.getByPlaceholderText('Type here');

    for (const chip of CHIPS) {
      const chipNode = screen.getByText(chip);
      expect(
        chipNode.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('focuses the input when the box is clicked', () => {
    renderField();

    fireEvent.click(box() as HTMLElement);

    expect(screen.getByPlaceholderText('Type here')).toHaveFocus();
  });

  it('does not focus the input while disabled', () => {
    renderField({ disabled: true });

    fireEvent.click(box() as HTMLElement);

    expect(screen.getByPlaceholderText('Type here')).not.toHaveFocus();
  });
});

/**
 * Row capping is measured from `offsetTop`, which jsdom reports as 0 for
 * every element, so the cut itself is covered in `chip-rows.test.ts`. What
 * is asserted here is the wiring: a row cap subscribes to size and a field
 * without one pays nothing.
 */
describe('ChipField row capping', () => {
  const observerSpy = () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const construct = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          construct(callback);
        }

        observe = observe;
        unobserve = () => undefined;
        disconnect = disconnect;
      },
    );

    return { construct, observe, disconnect };
  };

  it('observes the box when a row cap is set', () => {
    const { construct, observe } = observerSpy();

    renderField({ maxVisibleRows: 2 });

    expect(construct).toHaveBeenCalled();
    expect(observe).toHaveBeenCalledWith(box());
  });

  it('creates no observer when no row cap is set', () => {
    const { construct } = observerSpy();

    renderField();

    expect(construct).not.toHaveBeenCalled();
  });

  it('stops observing when unmounted', () => {
    const { disconnect } = observerSpy();

    const view = renderField({ maxVisibleRows: 2 });
    view.unmount();

    expect(disconnect).toHaveBeenCalled();
  });

  it('renders every chip while nothing has been measured as overflowing', () => {
    observerSpy();

    renderField({ maxVisibleRows: 2 });

    for (const chip of CHIPS) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }

    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument();
  });

  it('caps the rows on mount without waiting for another render', () => {
    observerSpy();

    const offsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');

    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const parent = (this as HTMLElement).parentElement;

        return parent ? Array.from(parent.children).indexOf(this as HTMLElement) * 20 : 0;
      },
    });

    try {
      renderField({ maxVisibleRows: 2 });

      expect(screen.getByRole('button', { name: '+1 more' })).toBeInTheDocument();
      expect(screen.queryByText('Headwear')).not.toBeInTheDocument();
    } finally {
      if (offsetTop) {
        Object.defineProperty(HTMLElement.prototype, 'offsetTop', offsetTop);
      }
    }
  });
});
