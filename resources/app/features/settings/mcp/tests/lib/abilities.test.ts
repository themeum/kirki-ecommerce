import { describe, expect, it } from 'vitest';

import {
  countAbilities,
  countAbilitiesOn,
  countGroupAbilitiesOn,
  isAbilityBlocked,
  isAbilityOn,
  isGroupOn,
  type McpSwitches,
  resetAbilities,
} from '@/features/settings/mcp/lib/abilities';
import type { McpAbility, McpAbilityGroup } from '@/features/settings/mcp/schemas/catalog/mcp';

const ability = (name: string, kind: McpAbility['kind'], isWrite = false): McpAbility => ({
  name: `kirki-ecommerce/${name}`,
  kind,
  title: name,
  description: '',
  is_write: isWrite,
});

const many = (prefix: string, count: number, kind: McpAbility['kind'], isWrite = false) =>
  Array.from({ length: count }, (_, index) => ability(`${prefix}-${index}`, kind, isWrite));

const catalog: McpAbilityGroup[] = [
  {
    id: 'sales',
    label: 'Sales',
    description: '',
    abilities: [
      ...many('sales-read', 4, 'tool'),
      ...many('sales-res', 1, 'resource'),
      ...many('sales-prompt', 3, 'prompt'),
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    description: '',
    abilities: [
      ability('find-orders', 'tool'),
      ability('get-order', 'tool'),
      ...many('orders-write', 5, 'tool', true),
      ability('cancel-order', 'tool', true),
      ...many('orders-res', 1, 'resource'),
      ...many('orders-prompt', 1, 'prompt'),
    ],
  },
  {
    id: 'products',
    label: 'Products',
    description: '',
    abilities: [
      ...many('products-read', 2, 'tool'),
      ...many('products-write', 6, 'tool', true),
      ...many('products-res', 1, 'resource'),
      ...many('products-prompt', 1, 'prompt'),
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    description: '',
    abilities: [...many('customers-read', 1, 'tool'), ...many('customers-write', 1, 'tool', true)],
  },
  {
    id: 'coupons',
    label: 'Coupons',
    description: '',
    abilities: [ability('find-coupons', 'tool'), ...many('coupons-write', 3, 'tool', true)],
  },
  {
    id: 'store_setup',
    label: 'Store setup',
    description: '',
    abilities: [
      ...many('setup-read', 1, 'tool'),
      ...many('setup-write', 2, 'tool', true),
      ...many('setup-res', 4, 'resource'),
      ...many('setup-prompt', 1, 'prompt'),
    ],
  },
];

const defaults: McpSwitches = { enabled: true, read_only: false, groups: {}, abilities: {} };
const cancelOrder = ability('cancel-order', 'tool', true);
const findOrders = ability('find-orders', 'tool');

describe('MCP ability rules', () => {
  it('counts every ability as on by default', () => {
    expect(countAbilities(catalog)).toBe(42);
    expect(countAbilitiesOn(defaults, catalog)).toBe(42);
  });

  it('shows 24 of 42 on when read-only mode blocks the 18 write tools', () => {
    expect(countAbilitiesOn({ ...defaults, read_only: true }, catalog)).toBe(24);
  });

  it('turns every ability of a group off when the group is off', () => {
    const switches = {
      ...defaults,
      groups: { orders: false },
      abilities: { [findOrders.name]: true },
    };

    expect(isGroupOn(switches, 'orders')).toBe(false);
    expect(isAbilityBlocked(switches, 'orders', findOrders)).toBe(true);
    expect(isAbilityOn(switches, 'orders', findOrders)).toBe(false);
    expect(countGroupAbilitiesOn(switches, catalog[1])).toBe(0);
  });

  it('blocks only write tools in read-only mode', () => {
    const switches = { ...defaults, read_only: true };

    expect(isAbilityBlocked(switches, 'orders', cancelOrder)).toBe(true);
    expect(isAbilityOn(switches, 'orders', findOrders)).toBe(true);
  });

  it('keeps each stored value when a group or read-only mode turns back on', () => {
    const abilities = { [cancelOrder.name]: false };

    expect(isAbilityOn({ ...defaults, abilities }, 'orders', cancelOrder)).toBe(false);
    expect(isAbilityOn({ ...defaults, abilities }, 'orders', findOrders)).toBe(true);
  });

  it('resets groups, abilities and read-only mode but keeps the main switch', () => {
    const switches = {
      enabled: true,
      read_only: true,
      groups: { orders: false },
      abilities: { [cancelOrder.name]: false },
    };

    expect(resetAbilities(switches)).toEqual({
      enabled: true,
      read_only: false,
      groups: {},
      abilities: {},
    });
  });
});
