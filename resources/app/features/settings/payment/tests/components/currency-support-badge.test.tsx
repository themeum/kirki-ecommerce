import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CurrencySupportBadge from '@/features/settings/payment/components/list/currency-support-badge';

describe('CurrencySupportBadge', () => {
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

  it.each([[{ status: 'supported' as const, message: null }], [null], [undefined]])(
    'shows no badge for %o',
    (support) => {
      const { container } = render(<CurrencySupportBadge support={support} />);

      expect(container.textContent).toBe('');
    },
  );
});
