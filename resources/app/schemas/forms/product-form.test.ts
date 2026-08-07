import { describe, expect, it } from 'vitest';

import {
  getDefaultVariantValues,
  mapProductToFormValues,
  ProductFormSchema,
  ProductFormVariantSchema,
} from '@/schemas/forms/product-form';

const baseVariantInput = {
  ...getDefaultVariantValues(),
  name: 'Small',
};

const baseProductInput = {
  title: 'T-Shirt',
  ribbon: '',
  slug: 't-shirt',
  short_description: '',
  description: '',
  status: 'draft',
  brand: null,
  currency: null,
  categories: [],
  tags: [],
  collections: [],
  media: [],
  additional_info: [],
  seo_keywords: [],
  has_variants: false,
  attributes: [],
  variants: [baseVariantInput],
  seo_title: '',
  seo_description: '',
  llm_instructions: '',
  og_title: '',
  og_description: '',
  og_image: null,
  schema_id: null,
};

describe('ProductFormVariantSchema', () => {
  it('produces the exact payload for a fully filled variant', () => {
    const result = ProductFormVariantSchema.parse({
      ...baseVariantInput,
      id: 5,
      name: 'Small',
      media: { id: 3, url: 'https://x/v.png' },
      sku: 'SKU-1',
      base_price: '19.99',
      available_quantity: '10',
      committed_quantity: '2',
      min_stock_threshold: '5',
      max_per_order: '3',
      tax_profile_id: '7',
      shipping_profile_id: '8',
      shipping_box_id: '9',
      in_stock: 'true',
      attribute_values: [1, 2],
    });

    expect(result).toEqual({
      id: 5,
      name: 'Small',
      media: 3,
      sku: 'SKU-1',
      barcode: null,
      base_price: '19.99',
      show_unit_price: false,
      base_unit: null,
      base_unit_amount: null,
      total_unit: null,
      total_unit_amount: null,
      base_sale_price: null,
      base_cost_of_goods: null,
      weight: null,
      weight_unit: null,
      dimension_unit: null,
      charge_taxes: true,
      allow_back_order: false,
      track_inventory: false,
      available_quantity: 10,
      in_stock: true,
      committed_quantity: 2,
      min_stock_threshold: 5,
      has_limit_per_order: false,
      max_per_order: 3,
      tax_profile_id: 7,
      shipping_profile_id: 8,
      shipping_box_id: 9,
      is_visible: true,
      is_physical_product: true,
      is_default: true,
      attribute_values: [1, 2],
    });
  });

  it('defaults available_quantity and committed_quantity to 0 rather than null', () => {
    const result = ProductFormVariantSchema.parse({
      ...baseVariantInput,
      available_quantity: null,
      committed_quantity: null,
    });
    expect(result.available_quantity).toBe(0);
    expect(result.committed_quantity).toBe(0);
  });

  it('treats the string "false" as in_stock: false', () => {
    const result = ProductFormVariantSchema.parse({ ...baseVariantInput, in_stock: 'false' });
    expect(result.in_stock).toBe(false);
  });

  it('collapses a video media object to id + poster', () => {
    const result = ProductFormVariantSchema.parse({
      ...baseVariantInput,
      media: { id: 4, url: 'https://x/v.mp4', mime: 'video/mp4', poster: { id: 2, url: 'https://x/p.png' } },
    });
    expect(result.media).toEqual({ id: 4, poster: 2 });
  });

  it('sends null for blank sku, barcode, and unit fields rather than empty strings', () => {
    const result = ProductFormVariantSchema.parse({
      ...baseVariantInput,
      sku: '',
      barcode: '',
      base_unit: '',
      weight_unit: '',
    });
    expect(result.sku).toBeNull();
    expect(result.barcode).toBeNull();
    expect(result.base_unit).toBeNull();
    expect(result.weight_unit).toBeNull();
  });
});

describe('ProductFormSchema', () => {
  it('produces the exact payload for a simple product', () => {
    const result = ProductFormSchema.parse(baseProductInput);

    expect(result.title).toBe('T-Shirt');
    expect(result.slug).toBe('t-shirt');
    expect(result.status).toBe('draft');
    expect(result.og_image).toBeNull();
    expect(result.brand_id).toBeNull();
    expect(result.currency_id).toBeNull();
    expect(result.media).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.variants).toHaveLength(1);
  });

  it('always sends og_image as null even when the field holds a value', () => {
    const result = ProductFormSchema.parse({ ...baseProductInput, og_image: { id: 1, url: 'https://x/og.png' } });
    expect(result.og_image).toBeNull();
  });

  it('flattens brand, currency, categories, tags, and collections to ids', () => {
    const result = ProductFormSchema.parse({
      ...baseProductInput,
      brand: { id: 12, name: 'Acme', logo: null },
      currency: { id: 3, code: 'USD', name: 'US Dollar', symbol: '$' },
      categories: [{ id: 1, name: 'Shoes' }, { id: 2, name: 'Boots' }],
      tags: [{ id: 5, name: 'Sale' }],
      collections: [{ id: 9, title: 'Winter' }],
    });

    expect(result.brand_id).toBe(12);
    expect(result.currency_id).toBe(3);
    expect(result.categories).toEqual([1, 2]);
    expect(result.tags).toEqual([5]);
    expect(result.collections).toEqual([9]);
  });

  it('flattens media to an array of numeric ids', () => {
    const result = ProductFormSchema.parse({
      ...baseProductInput,
      media: [{ id: 1, url: 'https://x/1.png' }, { id: '2', url: 'https://x/2.png' }],
    });
    expect(result.media).toEqual([1, 2]);
  });

  it('flattens attribute values to numeric id arrays', () => {
    const result = ProductFormSchema.parse({
      ...baseProductInput,
      attributes: [
        { id: 1, name: 'Color', values: [{ id: 10, value: 'Red' }, { id: 11, value: 'Blue' }] },
      ],
    });
    expect(result.attributes).toEqual([{ id: 1, values: [10, 11] }]);
  });

  it('sends null for blank ribbon, slug, and description rather than empty strings', () => {
    const result = ProductFormSchema.parse({ ...baseProductInput, ribbon: '', slug: '', description: '' });
    expect(result.ribbon).toBeNull();
    expect(result.slug).toBeNull();
    expect(result.description).toBeNull();
  });

  it('rejects a blank required title', () => {
    const result = ProductFormSchema.safeParse({ ...baseProductInput, title: '  ' });
    expect(result.success).toBe(false);
  });

  it('rejects a product with zero variants', () => {
    const result = ProductFormSchema.safeParse({ ...baseProductInput, variants: [] });
    expect(result.success).toBe(false);
  });
});

describe('mapProductToFormValues', () => {
  const productWithNoVariants = {
    id: 1,
    title: 'Empty Product',
    slug: 'empty-product',
    status: 'draft',
    ribbon: null,
    currency: null,
    brand: null,
    description: null,
    short_description: null,
    additional_info: null,
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    schema_id: null,
    llm_instructions: null,
    og_title: null,
    og_description: null,
    og_image: null,
    has_variants: false,
    categories: [],
    tags: [],
    collections: [],
    attributes: [],
    variants: [],
    media: [],
  };

  it('falls back to a single default variant when the product has none', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formValues = mapProductToFormValues(productWithNoVariants as any);
    expect(formValues.variants).toHaveLength(1);
    expect(formValues.variants?.[0]?.in_stock).toBe(true);
  });

  it('converts a null additional_info/seo_keywords into empty arrays', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formValues = mapProductToFormValues(productWithNoVariants as any);
    expect(formValues.additional_info).toEqual([]);
    expect(formValues.seo_keywords).toEqual([]);
  });

  it('reads an existing variant max_per_order of null as 1, not null', () => {
    const productWithVariant = {
      ...productWithNoVariants,
      variants: [
        {
          id: 2,
          name: 'Default',
          media: null,
          sku: null,
          barcode: null,
          base_price: null,
          show_unit_price: false,
          base_unit: null,
          base_unit_amount: null,
          total_unit: null,
          total_unit_amount: null,
          base_sale_price: null,
          base_cost_of_goods: null,
          weight: null,
          weight_unit: null,
          dimension_unit: null,
          charge_taxes: true,
          allow_back_order: false,
          track_inventory: false,
          available_quantity: 0,
          in_stock: true,
          committed_quantity: 0,
          min_stock_threshold: null,
          has_limit_per_order: true,
          max_per_order: null,
          tax_profile_id: null,
          shipping_profile_id: null,
          shipping_box_id: null,
          is_visible: true,
          is_physical_product: true,
          is_default: true,
          attribute_values: [],
        },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formValues = mapProductToFormValues(productWithVariant as any);
    expect(formValues.variants?.[0]?.max_per_order).toBe(1);
  });
});
