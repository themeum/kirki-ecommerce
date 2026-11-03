import { describe, expect, it } from 'vitest';

import {
  MigrationLatestRunSchema,
  MigrationProgressSchema,
  MigrationRunSchema,
  MigrationScanSchema,
  MigrationSourcesSchema,
} from '@/features/migration/schemas/catalog/migration';

const groupState = {
  label: 'Products',
  status: 'running',
  cursor: 30,
  total: 70,
  done: 30,
  created: 29,
  reused: 0,
  skipped: 1,
};

describe('migration response schemas', () => {
  it('parses a source with its version state and extensions', () => {
    const result = MigrationSourcesSchema.parse([
      {
        id: 'woocommerce',
        label: 'WooCommerce',
        version: { version: '8.4.0', minimum: '7.0.0', supported: true },
        extensions: [{ slug: 'wordpress-seo', label: 'Yoast SEO', status: 'supported' }],
      },
    ]);

    expect(result[0].version.supported).toBe(true);
    expect(result[0].extensions[0].status).toBe('supported');
  });

  it('parses a scan with groups and counts', () => {
    const result = MigrationScanSchema.parse({
      source: 'woocommerce',
      groups: [{ id: 'products', label: 'Products', count: 100 }],
      extensions: [],
    });

    expect(result.groups).toEqual([{ id: 'products', label: 'Products', description: '', count: 100 }]);
  });

  it('reads the groups of a run as an object', () => {
    const run = MigrationRunSchema.parse({
      id: 5,
      source: 'woocommerce',
      status: 'running',
      groups: { products: groupState },
      skipped_items: [{ group: 'products', source_id: 12, reason: 'Unsupported' }],
      last_error: null,
    });

    expect(run.groups.products.done).toBe(30);
    expect(run.skipped_items[0].source_id).toBe(12);
  });

  it('accepts the empty array that PHP sends for an empty groups object', () => {
    const run = MigrationRunSchema.parse({
      id: 5,
      source: 'woocommerce',
      status: 'pending',
      groups: [],
      skipped_items: [],
      last_error: null,
    });

    expect(run.groups).toEqual({});
  });

  it('allows no unfinished run', () => {
    expect(MigrationLatestRunSchema.parse(null)).toBeNull();
  });

  it('parses the progress that a chunk returns, with its notes', () => {
    const progress = MigrationProgressSchema.parse({
      run_id: 5,
      status: 'running',
      done: false,
      group: 'products',
      label: 'Products',
      range_from: 1,
      range_to: 30,
      group_finished: false,
      groups: { products: groupState },
      notes: ['The SKU "A" was already used.'],
    });

    expect(progress.range_to).toBe(30);
    expect(progress.notes).toHaveLength(1);
  });

  it('rejects a progress payload that has no run id', () => {
    expect(() => MigrationProgressSchema.parse({ done: true })).toThrow();
  });
});
