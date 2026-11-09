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
