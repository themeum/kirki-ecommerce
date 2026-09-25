import { describe, expect, it } from 'vitest';

import {
  findAttributeNameClash,
  ProductAttributeFormSchema,
  toProductAttributeFormValues,
} from '@/features/products/schemas/forms/product-attribute-form';

const SIZE = {
  id: 2,
  name: 'Size',
  type: 'list',
  values: [
    { id: 21, value: 'S' },
    { id: 22, value: 'M' },
  ],
};

const COLOR = {
  id: 1,
  name: 'Color',
  type: 'color',
  values: [
    { id: 11, value: 'Blue', color: '#0000ff' },
    { id: 12, value: 'Orange', color: '#ffa500' },
  ],
};

describe('ProductAttributeFormSchema', () => {
  it('creates a list attribute with every value from the new-attribute form', () => {
    const result = ProductAttributeFormSchema.parse({
      ...toProductAttributeFormValues(),
      name: ' Fabric ',
      values: [{ value: 'Cotton' }, { value: 'Linen', color: '' }],
    });

    expect(result).toEqual({
      kind: 'create',
      name: 'Fabric',
      type: 'list',
      replaces: null,
      values: [
        { value: 'Cotton', color: null },
        { value: 'Linen', color: null },
      ],
    });
  });

  it('sends an empty sync for an unchanged attribute', () => {
    const result = ProductAttributeFormSchema.parse(toProductAttributeFormValues(SIZE, SIZE.values));

    expect(result).toEqual({ kind: 'sync', attribute_id: 2, create: [], update: [] });
  });

  it('sends draft values and recolors for the same attribute', () => {
    const draft = toProductAttributeFormValues(COLOR, COLOR.values);
    draft.values[0].color = '#0000cc';
    draft.values.push({ value: 'Teal', color: '#008080' });

    expect(ProductAttributeFormSchema.parse(draft)).toEqual({
      kind: 'sync',
      attribute_id: 1,
      create: [{ value: 'Teal', color: '#008080' }],
      update: [{ id: 11, color: '#0000cc' }],
    });
  });

  it('treats a case-only name change as the same attribute', () => {
    const result = ProductAttributeFormSchema.parse({
      ...toProductAttributeFormValues(SIZE, SIZE.values),
      name: 'size ',
    });

    expect(result.kind).toBe('sync');
  });

  it('creates a copy that replaces the source when renamed', () => {
    const result = ProductAttributeFormSchema.parse({
      ...toProductAttributeFormValues(COLOR, COLOR.values),
      name: 'Shade',
    });

    expect(result).toEqual({
      kind: 'create',
      name: 'Shade',
      type: 'color',
      replaces: 1,
      values: [
        { value: 'Blue', color: '#0000ff' },
        { value: 'Orange', color: '#ffa500' },
      ],
    });
  });

  it('rejects a blank name', () => {
    const result = ProductAttributeFormSchema.safeParse({
      ...toProductAttributeFormValues(),
      name: '  ',
      values: [{ value: 'Cotton' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a draft with no values', () => {
    const result = ProductAttributeFormSchema.safeParse(toProductAttributeFormValues(SIZE, []));

    expect(result.success).toBe(false);
  });
});

describe('findAttributeNameClash', () => {
  const attributes = [SIZE, COLOR, { id: 3, name: 'Material' }];

  it('matches another attribute ignoring case and whitespace', () => {
    expect(findAttributeNameClash(' material ', attributes, SIZE.id)?.id).toBe(3);
  });

  it('ignores the attribute the card started from', () => {
    expect(findAttributeNameClash('Size', attributes, SIZE.id)).toBeUndefined();
  });

  it('ignores an empty name', () => {
    expect(findAttributeNameClash('  ', attributes)).toBeUndefined();
  });
});
