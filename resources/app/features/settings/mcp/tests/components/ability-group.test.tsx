import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AbilityGroup from '@/features/settings/mcp/components/ability-group';
import type { McpSwitches } from '@/features/settings/mcp/lib/abilities';
import type { McpAbilityGroup } from '@/features/settings/mcp/schemas/catalog/mcp';

const coupons: McpAbilityGroup = {
  id: 'coupons',
  label: 'Coupons',
  description: 'Find coupons, and create, update, turn on or turn off coupons.',
  abilities: [
    {
      name: 'kirki-ecommerce/find-coupons',
      kind: 'tool',
      title: 'Find coupons',
      description: '',
      is_write: false,
    },
    {
      name: 'kirki-ecommerce/create-coupon',
      kind: 'tool',
      title: 'Create coupon',
      description: '',
      is_write: true,
    },
  ],
};

const defaults: McpSwitches = { enabled: true, read_only: false, groups: {}, abilities: {} };

const renderGroup = (switches: McpSwitches, onToggleAbility = vi.fn(), onToggleGroup = vi.fn()) => {
  render(
    <AbilityGroup
      group={coupons}
      switches={switches}
      onToggleGroup={onToggleGroup}
      onToggleAbility={onToggleAbility}
    />,
  );

  fireEvent.click(screen.getByText('Coupons'));
};

afterEach(cleanup);

describe('AbilityGroup', () => {
  it('shows the description and the read and write counts in the header', () => {
    render(
      <AbilityGroup
        group={coupons}
        switches={defaults}
        onToggleGroup={vi.fn()}
        onToggleAbility={vi.fn()}
      />,
    );

    expect(screen.getByText(coupons.description)).toBeInTheDocument();
    expect(screen.getByText('1 read')).toBeInTheDocument();
    expect(screen.getByText('1 write')).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Find coupons' })).not.toBeInTheDocument();
  });

  it('shows the rows off and disabled when the group is off', () => {
    renderGroup({ ...defaults, groups: { coupons: false } });

    const findCoupons = screen.getByRole('switch', { name: 'Find coupons' });

    expect(findCoupons).toHaveAttribute('aria-checked', 'false');
    expect(findCoupons).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Coupons' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('blocks only the write tool in read-only mode', () => {
    renderGroup({ ...defaults, read_only: true });

    expect(screen.getByRole('switch', { name: 'Find coupons' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Create coupon' })).toBeDisabled();
    expect(screen.getByText('Blocked by read-only')).toBeInTheDocument();
  });

  it('marks each ability with an icon for its kind', () => {
    renderGroup(defaults);

    expect(screen.getAllByRole('img', { name: 'Tool' })).toHaveLength(2);
  });

  it('reports the ability name and the group id when a switch changes', () => {
    const onToggleAbility = vi.fn();
    const onToggleGroup = vi.fn();

    renderGroup(defaults, onToggleAbility, onToggleGroup);
    fireEvent.click(screen.getByRole('switch', { name: 'Create coupon' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Coupons' }));

    expect(onToggleAbility).toHaveBeenCalledWith('kirki-ecommerce/create-coupon', false);
    expect(onToggleGroup).toHaveBeenCalledWith('coupons', false);
  });
});
