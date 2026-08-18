import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { mergeDateTime } from '@/features/coupons/lib/coupon-datetime';
import { CouponFormSchema } from '@/features/coupons/schemas/forms/coupon-form';
import type { ProductSelection } from '@/features/products/schemas/catalog/product-selection';
import { DATE_FORMATS } from '@/libs/date';
import { getDefaults } from '@/libs/zod';

const expectedDateTime = (date: string, time: string) =>
  format(mergeDateTime(date, time)!, DATE_FORMATS.ATOM);

describe('CouponFormSchema', () => {
  const base = {
    method: 'code',
    title: 'Summer Sale',
    code: 'SUMMER10',
    discount_type: 'amount-off',
    discount_target: 'order',
    discount_value_type: 'fixed',
    discount_amount: '10',
    start_date: '2026-06-01',
    start_time: '09:00',
    has_end_datetime: false,
    end_date: null,
    end_time: null,
    has_usage_limit: false,
    usage_limit: null,
    has_customer_limit: false,
    customer_limit: null,
  };

  it('produces the exact payload for a fully filled amount-off coupon', () => {
    const result = CouponFormSchema.parse(base);
    expect(result).toEqual({
      method: 'code',
      title: 'Summer Sale',
      code: 'SUMMER10',
      discount_type: 'amount-off',
      discount_target: 'order',
      eligible_item_type: null,
      discount_value_type: 'fixed',
      discount_amount: '10',
      start_datetime: expectedDateTime('2026-06-01', '09:00'),
      has_end_datetime: false,
      end_datetime: null,
      has_usage_limit: false,
      usage_limit: null,
      has_customer_limit: false,
      customer_limit: null,
      product_ids: [],
      category_ids: [],
      target_country_type: 'all-countries',
      target_countries: null,
      first_time_buyer_only: false,
      customer_include_eligibility: 'all',
      customer_ids: [],
      customer_exclude_eligibility: 'none',
      exclude_customer_ids: [],
    });
  });

  it('nulls code when method is not code', () => {
    const result = CouponFormSchema.parse({ ...base, method: 'automatic', code: null });
    expect(result.code).toBeNull();
  });

  it('requires code when method is code and code is blank', () => {
    const result = CouponFormSchema.safeParse({ ...base, method: 'code', code: '' });
    expect(result.success).toBe(false);
  });

  it('does not require code when method is not code', () => {
    const result = CouponFormSchema.safeParse({ ...base, method: 'automatic', code: null });
    expect(result.success).toBe(true);
  });

  it('nulls discount fields when discount_type is not amount-off', () => {
    const result = CouponFormSchema.parse({
      ...base,
      discount_type: 'free-shipping',
      discount_target: 'order',
      discount_value_type: 'fixed',
      discount_amount: '10',
    });
    expect(result.discount_target).toBeNull();
    expect(result.discount_value_type).toBeNull();
    expect(result.discount_amount).toBeNull();
  });

  it('requires discount_value_type and discount_amount when discount_type is amount-off', () => {
    const missingType = CouponFormSchema.safeParse({
      ...base,
      discount_type: 'amount-off',
      discount_value_type: null,
    });
    expect(missingType.success).toBe(false);

    const missingAmount = CouponFormSchema.safeParse({
      ...base,
      discount_type: 'amount-off',
      discount_amount: null,
    });
    expect(missingAmount.success).toBe(false);
  });

  it('includes end_datetime only when has_end_datetime is true', () => {
    const withEnd = CouponFormSchema.parse({
      ...base,
      has_end_datetime: true,
      end_date: '2026-06-30',
      end_time: '23:59',
    });
    expect(withEnd.end_datetime).toBe(expectedDateTime('2026-06-30', '23:59'));

    const withoutEnd = CouponFormSchema.parse({ ...base, has_end_datetime: false });
    expect(withoutEnd.end_datetime).toBeNull();
  });

  it('requires end_date when has_end_datetime is true and end_date is blank', () => {
    const result = CouponFormSchema.safeParse({
      ...base,
      has_end_datetime: true,
      end_date: null,
    });
    expect(result.success).toBe(false);
  });

  it('nulls usage_limit and customer_limit when their toggles are off', () => {
    const result = CouponFormSchema.parse({
      ...base,
      has_usage_limit: false,
      usage_limit: 100,
      has_customer_limit: false,
      customer_limit: 5,
    });
    expect(result.usage_limit).toBeNull();
    expect(result.customer_limit).toBeNull();
  });

  it('requires usage_limit and customer_limit when their toggles are on', () => {
    const missingUsage = CouponFormSchema.safeParse({
      ...base,
      has_usage_limit: true,
      usage_limit: null,
    });
    expect(missingUsage.success).toBe(false);

    const missingCustomer = CouponFormSchema.safeParse({
      ...base,
      has_customer_limit: true,
      customer_limit: null,
    });
    expect(missingCustomer.success).toBe(false);
  });

  const productSelection = (productId: number): ProductSelection => ({
    productId,
    productTitle: `Product ${productId}`,
    thumbnail: null,
    inStock: true,
    regularPrice: { raw: 10, display: '$10', currency: { code: 'USD', symbol: '$' } },
    salePrice: null,
    variants: [],
  });

  const productTarget = {
    ...base,
    discount_target: 'products',
    eligible_item_type: 'specific-products',
    products: [productSelection(1), productSelection(2)],
  };

  const shoesCategory = { id: 7, name: 'Shoes', slug: 'shoes' };

  it('sends product_ids only when eligible items is specific-products', () => {
    const result = CouponFormSchema.parse(productTarget);
    expect(result.eligible_item_type).toBe('specific-products');
    expect(result.product_ids).toEqual([1, 2]);
    expect(result.category_ids).toEqual([]);
  });

  it('flattens selected categories to category_ids when eligible items is specific-categories', () => {
    const result = CouponFormSchema.parse({
      ...productTarget,
      eligible_item_type: 'specific-categories',
      categories: [shoesCategory],
    });
    expect(result.product_ids).toEqual([]);
    expect(result.category_ids).toEqual([7]);
  });

  it('clears eligible items and both id lists when discount_target is order', () => {
    const result = CouponFormSchema.parse({
      ...productTarget,
      discount_target: 'order',
      categories: [shoesCategory],
    });
    expect(result.eligible_item_type).toBeNull();
    expect(result.product_ids).toEqual([]);
    expect(result.category_ids).toEqual([]);
  });

  it('requires a selection matching the chosen eligible item type', () => {
    const missingProducts = CouponFormSchema.safeParse({ ...productTarget, products: [] });
    expect(missingProducts.success).toBe(false);

    const missingCategories = CouponFormSchema.safeParse({
      ...productTarget,
      eligible_item_type: 'specific-categories',
      categories: [],
    });
    expect(missingCategories.success).toBe(false);

    const allProducts = CouponFormSchema.safeParse({
      ...productTarget,
      eligible_item_type: 'all-products',
      products: [],
    });
    expect(allProducts.success).toBe(true);
  });

  it('requires at least one region when targeting specific countries', () => {
    const missingRegions = CouponFormSchema.safeParse({
      ...base,
      target_country_type: 'specific-countries',
      target_countries: [],
    });
    expect(missingRegions.success).toBe(false);
    expect(missingRegions.error?.issues[0].message).toBe('Select at least one region');
  });

  it('passes the selected regions through untouched', () => {
    const regions = [{ country: 'US', states: ['5'] }];
    const result = CouponFormSchema.parse({
      ...base,
      target_country_type: 'specific-countries',
      target_countries: regions,
    });
    expect(result.target_country_type).toBe('specific-countries');
    expect(result.target_countries).toEqual(regions);
  });

  it('empties the regions when targeting all countries', () => {
    const result = CouponFormSchema.parse({
      ...base,
      target_country_type: 'all-countries',
      target_countries: [{ country: 'US', states: [] }],
    });
    expect(result.target_countries).toEqual(null);
  });

  const customer = (id: number) => ({
    id,
    first_name: `Customer ${id}`,
    last_name: null,
    email: `customer${id}@example.com`,
  });

  it('flattens both customer selections to their id lists', () => {
    const result = CouponFormSchema.parse({
      ...base,
      customer_include_eligibility: 'specific-customers',
      include_customers: [customer(1), customer(2)],
      customer_exclude_eligibility: 'specific-customers',
      exclude_customers: [customer(3)],
    });
    expect(result.customer_ids).toEqual([1, 2]);
    expect(result.exclude_customer_ids).toEqual([3]);
  });

  it('empties each customer list when its eligibility is not specific-customers', () => {
    const result = CouponFormSchema.parse({
      ...base,
      customer_include_eligibility: 'all',
      include_customers: [customer(1)],
      customer_exclude_eligibility: 'none',
      exclude_customers: [customer(3)],
    });
    expect(result.customer_ids).toEqual([]);
    expect(result.exclude_customer_ids).toEqual([]);
  });

  it('carries a guests-only pairing of include none and exclude all', () => {
    const result = CouponFormSchema.parse({
      ...base,
      customer_include_eligibility: 'none',
      customer_exclude_eligibility: 'all',
    });
    expect(result.customer_include_eligibility).toBe('none');
    expect(result.customer_exclude_eligibility).toBe('all');
    expect(result.customer_ids).toEqual([]);
    expect(result.exclude_customer_ids).toEqual([]);
  });

  it('requires a customer selection when either eligibility is specific-customers', () => {
    const missingInclude = CouponFormSchema.safeParse({
      ...base,
      customer_include_eligibility: 'specific-customers',
      include_customers: [],
    });
    expect(missingInclude.success).toBe(false);
    expect(missingInclude.error?.issues[0].message).toBe('Select at least one customer');

    const missingExclude = CouponFormSchema.safeParse({
      ...base,
      customer_exclude_eligibility: 'specific-customers',
      exclude_customers: [],
    });
    expect(missingExclude.success).toBe(false);
  });

  it('keeps a customer present in both lists on both sides of the payload', () => {
    const result = CouponFormSchema.parse({
      ...base,
      customer_include_eligibility: 'specific-customers',
      include_customers: [customer(1)],
      customer_exclude_eligibility: 'specific-customers',
      exclude_customers: [customer(1)],
    });
    expect(result.customer_ids).toEqual([1]);
    expect(result.exclude_customer_ids).toEqual([1]);
  });

  it('rejects a blank required title or start_date', () => {
    expect(CouponFormSchema.safeParse({ ...base, title: '  ' }).success).toBe(false);
    expect(CouponFormSchema.safeParse({ ...base, start_date: '' }).success).toBe(false);
  });

  it('getDefaults resolves every default including requiredWhen-wrapped fields', () => {
    const defaults = getDefaults(CouponFormSchema);
    expect(defaults).toMatchObject({
      method: 'code',
      discount_type: 'amount-off',
      discount_target: 'order',
      has_end_datetime: false,
      has_usage_limit: false,
      has_customer_limit: false,
      code: null,
      discount_value_type: null,
      discount_amount: undefined,
      start_time: null,
      end_date: null,
      end_time: null,
      usage_limit: null,
      customer_limit: null,
    });
  });
});
