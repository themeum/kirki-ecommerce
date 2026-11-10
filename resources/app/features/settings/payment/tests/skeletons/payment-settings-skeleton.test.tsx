import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import PaymentSettingsSkeleton from '@/features/settings/payment/skeletons/payment-settings-skeleton';

describe('PaymentSettingsSkeleton', () => {
  afterEach(cleanup);

  it('shows the Payments header', () => {
    render(<PaymentSettingsSkeleton />);

    expect(screen.getByText('Payments')).toBeTruthy();
  });

  it('shows heading, description and Add button placeholders above the list', () => {
    const { container } = render(<PaymentSettingsSkeleton />);
    const list = container.querySelector('[data-slot="stacked-items"]');
    const allSkeletons = Array.from(container.querySelectorAll('[data-slot="skeleton"]'));
    const headerSkeletons = allSkeletons.filter((skeleton) => !list?.contains(skeleton));

    expect(headerSkeletons).toHaveLength(3);
  });

  it('shows a bordered list of 3 rows with icon, name and switch placeholders', () => {
    const { container } = render(<PaymentSettingsSkeleton />);
    const rows = container.querySelectorAll(
      '[data-slot="stacked-items"] [data-slot="stacked-item"]',
    );

    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(row.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    });
  });
});
