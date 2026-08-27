import { describe, expect, it } from 'vitest';

import { ProductsSettingsFormSchema } from '@/features/settings/products/schemas/forms/products-settings-form';

describe('ProductsSettingsFormSchema', () => {
  const base = {
    weight_unit: 'kg',
    dimension_unit: 'm',
    shop_page: null,
    is_unit_price_visible: false,
    is_enabled_reviews: false,
    is_enabled_star_ratings: false,
    low_stock_threshold: null,
    barcode_generation: null,
  };

  it('produces the exact payload for a fully filled form', () => {
    const result = ProductsSettingsFormSchema.parse({ ...base, shop_page: '42', low_stock_threshold: '5' });
    expect(result.shop_page).toBe(42);
    expect(result.low_stock_threshold).toBe(5);
  });

  it('coerces an empty-string low_stock_threshold to null', () => {
    const result = ProductsSettingsFormSchema.parse({ ...base, low_stock_threshold: '' });
    expect(result.low_stock_threshold).toBeNull();
  });

  it('coerces an empty-string shop_page to null', () => {
    const result = ProductsSettingsFormSchema.parse({ ...base, shop_page: '' });
    expect(result.shop_page).toBeNull();
  });

  it('defaults booleans to false', () => {
    const result = ProductsSettingsFormSchema.parse(base);
    expect(result.is_unit_price_visible).toBe(false);
    expect(result.is_enabled_reviews).toBe(false);
    expect(result.is_enabled_star_ratings).toBe(false);
  });
});
