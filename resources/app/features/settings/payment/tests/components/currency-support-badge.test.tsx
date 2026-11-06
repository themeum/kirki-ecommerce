import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import CurrencySupportBadge from '@/features/settings/payment/components/list/currency-support-badge';

describe('CurrencySupportBadge', () => {
  afterEach(cleanup);

  it('shows Unsupported with the reason in its info icon', () => {
    render(
      <CurrencySupportBadge
        support={{ status: 'unsupported', message: 'bKash accepts only BDT.' }}
      />,
    );

    expect(screen.getByText('Unsupported')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'bKash accepts only BDT.' })).toBeTruthy();
  });

  it('shows Limited with the reason in its info icon', () => {
    render(
      <CurrencySupportBadge
        support={{ status: 'limited', message: 'Customers paying in USD cannot see bKash.' }}
      />,
    );

    expect(screen.getByText('Limited')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Customers paying in USD cannot see bKash.' })).toBeTruthy();
  });

  it('places the info icon after the label, not over it', () => {
    // Scoped styles apply only under the app root, so the test renders inside it.
    render(
      <div id="wpbody-content">
        <div className="kirki-ecommerce-root">
          <CurrencySupportBadge
            support={{ status: 'unsupported', message: 'bKash accepts only BDT.' }}
          />
        </div>
      </div>,
    );

    let element: HTMLElement | null = screen.getByRole('img', { name: 'bKash accepts only BDT.' });
    const badge = screen.getByText('Unsupported').closest('[data-slot="badge"]');

    expect(badge).toBeTruthy();

    while (element && element !== badge) {
      expect(getComputedStyle(element).position).not.toBe('absolute');
      element = element.parentElement;
    }
  });

  it('shows the badge without an icon when there is no reason', () => {
    render(<CurrencySupportBadge support={{ status: 'limited', message: null }} />);

    expect(screen.getByText('Limited')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it.each([[{ status: 'supported' as const, message: null }], [null], [undefined]])(
    'shows no badge for %o',
    (support) => {
      const { container } = render(<CurrencySupportBadge support={support} />);

      expect(container.textContent).toBe('');
    },
  );
});
