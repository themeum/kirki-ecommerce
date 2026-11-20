import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import QuickActions from '@/features/home/components/quick-actions';
import type { ActionKey, HomeLayoutItem } from '@/features/home/lib/layout';

const renderActions = (actions: HomeLayoutItem<ActionKey>[]) =>
  render(
    <MemoryRouter>
      <QuickActions actions={actions} />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe('QuickActions', () => {
  it('places the checked actions from right to left in list order', () => {
    renderActions([
      { key: 'add_product', visible: true },
      { key: 'view_live_site', visible: true },
      { key: 'create_coupon', visible: false },
      { key: 'create_order', visible: true },
      { key: 'add_customer', visible: false },
    ]);

    const buttons = screen.getAllByRole('link');
    const [left, middle, right] = buttons.map((button) => button.className);

    expect(buttons.map((button) => button.textContent)).toEqual([
      'Create order',
      'View live site',
      'Add product',
    ]);
    expect(left).toBe(middle);
    expect(right).not.toBe(left);
  });

  it('renders nothing when no action is checked', () => {
    const { container } = renderActions([
      { key: 'create_order', visible: false },
      { key: 'view_live_site', visible: false },
    ]);

    expect(container).toBeEmptyDOMElement();
  });
});
