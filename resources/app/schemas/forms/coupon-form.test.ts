import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { DATE_FORMATS } from '@/libs/date';
import { getDefaults } from '@/libs/zod';
import { mergeDateTime } from '@/pages/coupons/edit-coupon/config/coupon-datetime';
import { CouponFormSchema } from '@/schemas/forms/coupon-form';

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
      discount_value_type: 'fixed',
      discount_amount: '10',
      start_datetime: expectedDateTime('2026-06-01', '09:00'),
      has_end_datetime: false,
      end_datetime: null,
      has_usage_limit: false,
      usage_limit: null,
      has_customer_limit: false,
      customer_limit: null,
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
