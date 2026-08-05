import { describe, expect, it } from 'vitest';

import { VariationValueFormSchema } from '@/schemas/forms/variation-value-form';

describe('VariationValueFormSchema', () => {
  it('produces the exact payload for a color-type value', () => {
    const result = VariationValueFormSchema.parse({
      value: 'Cerulean',
      color: '#007ba7',
      type: 'color',
      attribute_id: 1,
    });
    expect(result).toEqual({ attribute_id: 1, value: 'Cerulean', color: '#007ba7', value_id: undefined });
  });

  it('forces color to null for a non-color type even when a color is present', () => {
    const result = VariationValueFormSchema.parse({
      value: 'Large',
      color: '#ffffff',
      type: 'list',
      attribute_id: 1,
    });
    expect(result.color).toBeNull();
  });

  it('includes value_id when editing an existing value', () => {
    const result = VariationValueFormSchema.parse({
      value: 'Cerulean',
      color: '#007ba7',
      type: 'color',
      attribute_id: 1,
      value_id: 42,
    });
    expect(result.value_id).toBe(42);
  });

  it('requires color when type is color', () => {
    const result = VariationValueFormSchema.safeParse({
      value: 'Cerulean',
      color: '',
      type: 'color',
      attribute_id: 1,
    });
    expect(result.success).toBe(false);
  });

  it('does not require color when type is not color', () => {
    const result = VariationValueFormSchema.safeParse({
      value: 'Large',
      color: '',
      type: 'list',
      attribute_id: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a blank required value', () => {
    const result = VariationValueFormSchema.safeParse({
      value: '  ',
      color: '',
      type: 'list',
      attribute_id: 1,
    });
    expect(result.success).toBe(false);
  });
});
