import { describe, expect, it } from 'vitest';

import {
  getOverallPercent,
  getProgressMessage,
} from '@/features/migration/lib/progress';
import type {
  MigrationGroupState,
  MigrationProgress,
} from '@/features/migration/schemas/catalog/migration';

const state = (overrides: Partial<MigrationGroupState> = {}): MigrationGroupState => ({
  label: 'Products',
  status: 'running',
  cursor: 0,
  total: 100,
  done: 0,
  created: 0,
  reused: 0,
  skipped: 0,
  ...overrides,
});

const progress = (overrides: Partial<MigrationProgress> = {}): MigrationProgress => ({
  run_id: 1,
  status: 'running',
  done: false,
  group: 'products',
  label: 'Products',
  range_from: 11,
  range_to: 20,
  group_finished: false,
  groups: { products: state({ total: 100, done: 20 }) },
  notes: [],
  ...overrides,
});

describe('getOverallPercent', () => {
  it('counts the finished items of every group against the total', () => {
    expect(
      getOverallPercent({
        products: state({ total: 100, done: 100, status: 'done' }),
        orders: state({ total: 300, done: 0, status: 'pending' }),
      }),
    ).toBe(25);
  });

  it('never goes over the total of a group', () => {
    expect(getOverallPercent({ products: state({ total: 10, done: 14 }) })).toBe(100);
  });

  it('is zero before any group is known', () => {
    expect(getOverallPercent({})).toBe(0);
  });

  it('is full when every group is empty and done', () => {
    expect(getOverallPercent({ settings: state({ total: 0, done: 0, status: 'done' }) })).toBe(100);
  });
});

describe('getProgressMessage', () => {
  it('describes the range, the group and the total of the current chunk', () => {
    expect(getProgressMessage(progress())).toBe('Migrating Products 11-20 of 100');
  });

  it('tells that the migration is being prepared before the first chunk', () => {
    expect(getProgressMessage(null)).toBe('Preparing the migration…');
  });

  it('tells that the migration is complete after the last chunk', () => {
    expect(getProgressMessage(progress({ done: true, group: null, label: null }))).toBe(
      'Migration complete',
    );
  });
});
