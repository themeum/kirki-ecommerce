import { describe, expect, it } from 'vitest';

import { SchemaProfileFormSchema } from '@/schemas/forms/schema-profile-form';

describe('SchemaProfileFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = SchemaProfileFormSchema.parse({
      name: 'General',
      schema: { Product: ['name'], Offer: ['price'] },
      is_default: true,
    });

    expect(result).toEqual({
      name: 'General',
      schema: { Product: ['name'], Offer: ['price'] },
      is_default: true,
    });
  });

  it('defaults is_default to false when omitted', () => {
    const result = SchemaProfileFormSchema.parse({
      name: 'General',
      schema: { Product: ['name'] },
    });
    expect(result.is_default).toBe(false);
  });

  it('rejects a blank required name', () => {
    const result = SchemaProfileFormSchema.safeParse({
      name: '  ',
      schema: { Product: ['name'] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty schema selection', () => {
    const result = SchemaProfileFormSchema.safeParse({
      name: 'General',
      schema: {},
    });
    expect(result.success).toBe(false);
  });
});
