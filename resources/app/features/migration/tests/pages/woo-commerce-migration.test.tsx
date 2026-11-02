import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteConfig } from '@/config/route-config';
import WooCommerceMigration from '@/features/migration/pages/woo-commerce-migration';

vi.mock('@/features/migration/components/migration-flow', () => ({
  default: ({ source, sourceLabel }: { source: string; sourceLabel: string }) => (
    <div>
      flow:{source}:{sourceLabel}
    </div>
  ),
}));

vi.mock('@/features/onboarding', () => ({
  COMPLETION_STEP: 99,
  OnboardingShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('WooCommerceMigration page', () => {
  afterEach(cleanup);

  it('shows the WooCommerce migration screen at its route', () => {
    render(
      <MemoryRouter initialEntries={[RouteConfig.Migration.get('WooCommerce').buildLink()]}>
        <Routes>
          <Route
            path={RouteConfig.Migration.get('WooCommerce').template}
            element={<WooCommerceMigration />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('flow:woocommerce:WooCommerce')).toBeTruthy();
  });
});
