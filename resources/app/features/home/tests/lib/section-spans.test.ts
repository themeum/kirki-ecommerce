import { describe, expect, it } from 'vitest';

import { getSectionSpans } from '@/features/home/lib/section-spans';

describe('getSectionSpans', () => {
  it('gives Key numbers the full width and pairs the other sections', () => {
    const spans = getSectionSpans(['key_numbers', 'recent_orders', 'top_products']);

    expect(Object.fromEntries(spans)).toEqual({
      key_numbers: 'full',
      recent_orders: 'half',
      top_products: 'half',
    });
  });

  it('stretches a half section that is alone in its row', () => {
    const spans = getSectionSpans([
      'key_numbers',
      'recent_orders',
      'top_products',
      'needs_attention',
    ]);

    expect(spans.get('needs_attention')).toBe('full');
    expect(spans.get('recent_orders')).toBe('half');
  });

  it('starts a new row after Key numbers', () => {
    const spans = getSectionSpans(['recent_orders', 'key_numbers', 'top_products', 'restock_soon']);

    expect(Object.fromEntries(spans)).toEqual({
      recent_orders: 'full',
      key_numbers: 'full',
      top_products: 'half',
      restock_soon: 'half',
    });
  });

  it('gives nothing for no sections', () => {
    expect(getSectionSpans([]).size).toBe(0);
  });
});
