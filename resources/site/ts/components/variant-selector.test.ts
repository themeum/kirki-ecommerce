import { describe, expect, it, vi } from 'vitest';

import type { Variant } from './variant-selector';
import { variantSelector } from './variant-selector';

vi.mock('../events', () => ({
  EVENTS: { VARIANT_CHANGED: 'kecom:variant:changed' },
  emit: vi.fn(),
}));

vi.stubGlobal('window', {
  location: { href: 'http://localhost/product/', search: '' },
  history: { replaceState: vi.fn() },
});

function makeVariant(id: number, color: string, size: string, available = true): Variant {
  return {
    id,
    product_id: 1,
    price: 10,
    stock: available ? 5 : 0,
    available,
    allow_back_order: false,
    has_limit_per_order: false,
    max_per_order: null,
    attributes: [
      { name: 'Color', value: color },
      { name: 'Size', value: size },
    ],
  };
}

/** Blue/Gray x S/M/L where only Blue-L is unavailable. */
function makeVariants(): Variant[] {
  return [
    makeVariant(1, 'Blue', 'S'),
    makeVariant(2, 'Blue', 'M'),
    makeVariant(3, 'Blue', 'L', false),
    makeVariant(4, 'Gray', 'S'),
    makeVariant(5, 'Gray', 'M'),
    makeVariant(6, 'Gray', 'L'),
  ];
}

function makeSelector(variants = makeVariants()) {
  const selector = variantSelector({ variants });
  selector.selectedAttributes = {};
  return selector;
}

describe('hasMatchingVariant', () => {
  it('is true when a variant matches every selected attribute', () => {
    const selector = makeSelector();
    selector.selectAttribute('Color', 'Blue');
    selector.selectAttribute('Size', 'M');

    expect(selector.hasMatchingVariant).toBe(true);
  });

  it('is false when no variant has the selected combination', () => {
    const selector = makeSelector(makeVariants().filter((variant) => variant.id !== 3));
    selector.selectAttribute('Color', 'Blue');
    selector.selectAttribute('Size', 'L');

    expect(selector.hasMatchingVariant).toBe(false);
  });
});

describe('isAttributeAvailable', () => {
  it('marks Blue unavailable for L but still lets the shopper select it', () => {
    const selector = makeSelector();
    selector.selectAttribute('Color', 'Gray');
    selector.selectAttribute('Size', 'L');

    expect(selector.isAttributeAvailable('Color', 'Blue')).toBe(false);

    selector.selectAttribute('Color', 'Blue');

    expect(selector.isAttributeSelected('Color', 'Blue')).toBe(true);
    expect(selector.isAttributeSelected('Size', 'L')).toBe(true);
    expect(selector.selectedVariant?.id).toBe(3);
    expect(selector.selectedVariant?.available).toBe(false);
  });

  it('marks Blue available again once a size Blue has is selected', () => {
    const selector = makeSelector();
    selector.selectAttribute('Color', 'Gray');
    selector.selectAttribute('Size', 'M');

    expect(selector.isAttributeAvailable('Color', 'Blue')).toBe(true);
  });
});
