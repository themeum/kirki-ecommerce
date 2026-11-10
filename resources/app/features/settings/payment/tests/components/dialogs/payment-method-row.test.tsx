import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PaymentMethodRow from '@/features/settings/payment/components/dialogs/payment-method-row';

const renderBlockedRow = () =>
  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <PaymentMethodRow
          name="Paystack"
          icon={null}
          status="update-blocked"
          blockedReason="Requires Kirki eCommerce 1.1.0"
          isBusy={false}
          isDisabled={false}
          onAdd={vi.fn()}
        />
      </div>
    </div>,
  );

describe('PaymentMethodRow with a blocked update', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the Update Available badge and no Update button', () => {
    renderBlockedRow();

    expect(screen.getByText('Update Available')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Update' })).toBeNull();
  });

  it('keeps the info icon in the layout, not absolutely placed', () => {
    renderBlockedRow();

    let element: HTMLElement | null = screen.getByLabelText('Requires Kirki eCommerce 1.1.0');

    while (element && !element.matches('.kirki-ecommerce-root')) {
      expect(getComputedStyle(element).position).not.toBe('absolute');
      element = element.parentElement;
    }
  });

  it('opens a tooltip with the reason when the pointer moves onto the icon', () => {
    vi.useFakeTimers();
    renderBlockedRow();

    const icon = screen.getByLabelText('Requires Kirki eCommerce 1.1.0');
    fireEvent.pointerMove(icon, { pointerType: 'mouse' });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('tooltip').textContent).toContain('Requires Kirki eCommerce 1.1.0');
  });
});

const renderBusyRow = (status: 'not-added' | 'update-available') =>
  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <PaymentMethodRow
          name="Amazon Pay"
          icon={null}
          status={status}
          isBusy
          isDisabled
          onAdd={vi.fn()}
          onUpdate={vi.fn()}
        />
      </div>
    </div>,
  );

describe('PaymentMethodRow while busy', () => {
  afterEach(cleanup);

  it('shows the spinner inside the Add button, not in place of it', () => {
    renderBusyRow('not-added');

    const button = document.querySelector('[data-slot="payment-method-add"]');

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button?.textContent).toContain('Add');
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });

  it('shows the spinner inside the Update button, not in place of it', () => {
    renderBusyRow('update-available');

    const button = document.querySelector('button[data-loading="true"]');

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button?.textContent).toContain('Update');
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });
});
