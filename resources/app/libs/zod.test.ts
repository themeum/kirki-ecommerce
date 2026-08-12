import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  booleanish,
  dateString,
  getDefaults,
  isEmptyValue,
  mediaId,
  numberOrNull,
  pickFormValues,
  prepareFormSchema,
  required,
  requiredWhen,
  stringOrNull,
} from '@/libs/zod';

describe('isEmptyValue', () => {
  it('treats null and undefined as empty', () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
  });

  it('treats whitespace-only strings as empty', () => {
    expect(isEmptyValue('   ')).toBe(true);
    expect(isEmptyValue('x')).toBe(false);
  });

  it('treats empty arrays and objects as empty', () => {
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue({})).toBe(true);
    expect(isEmptyValue([1])).toBe(false);
    expect(isEmptyValue({ a: 1 })).toBe(false);
  });

  it('does not treat 0 or false as empty', () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });
});

describe('required', () => {
  it('rejects empty values regardless of type', () => {
    const schema = z.object({
      text: required(z.string()),
      list: required(z.array(z.number())),
    });
    const result = schema.safeParse({ text: '  ', list: [] });
    expect(result.success).toBe(false);
  });

  it('accepts and narrows non-empty values', () => {
    const schema = z.object({ text: required(z.string()) });
    const result = schema.safeParse({ text: 'hello' });
    assert(result.success);
    // narrowed to non-nullable string, not `string | null | undefined`
    const value: string = result.data.text;
    expect(value).toBe('hello');
  });

  it('accepts a custom message', () => {
    const schema = required(z.string(), 'Custom message');
    const result = schema.safeParse(undefined);
    assert(!result.success);
    expect(result.error.issues[0].message).toBe('Custom message');
  });
});

describe('requiredWhen', () => {
  it('does not leak a rule across forms sharing a field builder', () => {
    const sharedField = z.string().nullish();

    const FormA = prepareFormSchema(
      z.object({
        method: z.enum(['code', 'auto']),
        code: requiredWhen(
          sharedField,
          (values) => values.method === 'code' && !values.code,
          'Code required in A',
        ),
      }),
    );

    // FormB reuses the same shared field builder but declares no rule on it.
    const FormB = z.object({
      method: z.enum(['code', 'auto']),
      code: sharedField,
    });

    const aResult = FormA.safeParse({ method: 'code', code: null });
    expect(aResult.success).toBe(false);

    const bResult = FormB.safeParse({ method: 'code', code: null });
    expect(bResult.success).toBe(true);
  });

  it('reports the error at the field path', () => {
    const schema = prepareFormSchema(
      z.object({
        method: z.enum(['code', 'auto']),
        code: requiredWhen(
          z.string().nullish(),
          (values) => values.method === 'code' && !values.code,
          'Code is required',
        ),
      }),
    );

    const result = schema.safeParse({ method: 'code', code: null });
    assert(!result.success);
    expect(result.error.issues[0].path).toEqual(['code']);
  });

  it('does not fire when the condition is false', () => {
    const schema = prepareFormSchema(
      z.object({
        method: z.enum(['code', 'auto']),
        code: requiredWhen(
          z.string().nullish(),
          (values) => values.method === 'code' && !values.code,
          'Code is required',
        ),
      }),
    );

    const result = schema.safeParse({ method: 'auto', code: null });
    expect(result.success).toBe(true);
  });
});

describe('prepareFormSchema nested paths', () => {
  type RootValues = {
    isBillingSameAsShipping?: boolean;
    billingAddress?: { postalCode?: string | null };
  };

  const buildSchema = () =>
    prepareFormSchema(
      z.object({
        isBillingSameAsShipping: z.boolean(),
        billingAddress: z.object({
          postalCode: requiredWhen(
            z.string().nullish(),
            (values) =>
              (values as RootValues).isBillingSameAsShipping === false &&
              !(values as RootValues).billingAddress?.postalCode,
            'Postal code is required',
          ),
        }),
      }),
    );

  it('reports a conditional rule on a nested field at its nested path, using root-level context', () => {
    const result = buildSchema().safeParse({
      isBillingSameAsShipping: false,
      billingAddress: { postalCode: null },
    });

    assert(!result.success);
    expect(result.error.issues[0].path).toEqual(['billingAddress', 'postalCode']);
  });

  it('passes when the nested condition is satisfied', () => {
    const result = buildSchema().safeParse({
      isBillingSameAsShipping: false,
      billingAddress: { postalCode: '12345' },
    });
    expect(result.success).toBe(true);
  });

  it('does not fire when the root-level condition is false', () => {
    const result = buildSchema().safeParse({
      isBillingSameAsShipping: true,
      billingAddress: { postalCode: null },
    });
    expect(result.success).toBe(true);
  });
});

describe('getDefaults', () => {
  it('reads top-level ZodDefault values', () => {
    const schema = z.object({ status: z.string().default('draft') });
    expect(getDefaults(schema)).toEqual({ status: 'draft' });
  });

  it('finds defaults wrapped by required()', () => {
    const schema = z.object({
      title: required(z.string().default('untitled')),
    });
    expect(getDefaults(schema)).toEqual({ title: 'untitled' });
  });

  it('returns undefined for fields with no default', () => {
    const schema = z.object({ note: z.string().optional() });
    expect(getDefaults(schema)).toEqual({ note: undefined });
  });
});

describe('pickFormValues', () => {
  it('picks matching keys from the source', () => {
    const schema = z.object({ name: z.string(), slug: z.string() });
    const result = pickFormValues(schema, { name: 'Widget', slug: 'widget', extra: 'ignored' });
    expect(result).toEqual({ name: 'Widget', slug: 'widget' });
  });

  it('falls back to the schema default when the source is missing a key', () => {
    const schema = z.object({
      name: z.string(),
      status: required(z.string().default('draft')),
    });
    const result = pickFormValues(schema, { name: 'Widget' });
    expect(result).toEqual({ name: 'Widget', status: 'draft' });
  });

  it('lets explicit overrides win over both source and defaults', () => {
    const schema = z.object({ name: z.string().default('') });
    const result = pickFormValues(schema, { name: 'from source' }, { name: 'override' });
    expect(result).toEqual({ name: 'override' });
  });
});

describe('mediaId', () => {
  const schema = z.object({ logo: mediaId() });

  it('passes through a bare id', () => {
    expect(schema.parse({ logo: 42 }).logo).toBe(42);
    expect(schema.parse({ logo: '42' }).logo).toBe(42);
  });

  it('collapses a non-video media object to its numeric id', () => {
    const result = schema.parse({ logo: { id: 7, url: 'https://x/y.png' } });
    expect(result.logo).toBe(7);
  });

  it('preserves the poster id for a video object', () => {
    const result = schema.parse({
      logo: { id: 9, url: 'https://x/y.mp4', mime: 'video/mp4', poster: { id: 3, url: 'https://x/p.png' } },
    });
    expect(result.logo).toEqual({ id: 9, poster: 3 });
  });

  it('sets poster to null when the video has none', () => {
    const result = schema.parse({
      logo: { id: 9, url: 'https://x/y.mp4', mime: 'video/mp4' },
    });
    expect(result.logo).toEqual({ id: 9, poster: null });
  });

  it('maps empty and nullish values to null', () => {
    expect(schema.parse({ logo: null }).logo).toBeNull();
    expect(schema.parse({ logo: undefined }).logo).toBeNull();
    expect(schema.parse({ logo: '' }).logo).toBeNull();
  });
});

describe('dateString', () => {
  const schema = z.object({ startsAt: dateString() });

  it('formats a Date to an ISO string', () => {
    const result = schema.parse({ startsAt: new Date('2026-01-01T00:00:00.000Z') });
    expect(result.startsAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('passes through an existing string unchanged', () => {
    const result = schema.parse({ startsAt: '2026-01-01T00:00:00.000Z' });
    expect(result.startsAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('maps empty and nullish values to null', () => {
    expect(schema.parse({ startsAt: null }).startsAt).toBeNull();
    expect(schema.parse({ startsAt: undefined }).startsAt).toBeNull();
    expect(schema.parse({ startsAt: '' }).startsAt).toBeNull();
  });
});

describe('numberOrNull', () => {
  const schema = z.object({ quantity: numberOrNull() });

  it('coerces numeric strings to numbers', () => {
    expect(schema.parse({ quantity: '5' }).quantity).toBe(5);
  });

  it('maps empty string, null, and undefined to null', () => {
    expect(schema.parse({ quantity: '' }).quantity).toBeNull();
    expect(schema.parse({ quantity: null }).quantity).toBeNull();
    expect(schema.parse({ quantity: undefined }).quantity).toBeNull();
  });

  it('maps a non-numeric string to null', () => {
    expect(schema.parse({ quantity: 'abc' }).quantity).toBeNull();
  });
});

describe('stringOrNull', () => {
  const schema = z.object({ addressLine2: stringOrNull() });

  it('maps empty string, whitespace, null, and undefined to null', () => {
    expect(schema.parse({ addressLine2: '' }).addressLine2).toBeNull();
    expect(schema.parse({ addressLine2: '   ' }).addressLine2).toBeNull();
    expect(schema.parse({ addressLine2: null }).addressLine2).toBeNull();
    expect(schema.parse({ addressLine2: undefined }).addressLine2).toBeNull();
  });

  it('trims a retained value', () => {
    expect(schema.parse({ addressLine2: ' Flat 2 ' }).addressLine2).toBe('Flat 2');
  });
});

describe('booleanish', () => {
  it('treats the string "false" as false', () => {
    const schema = z.object({ enabled: booleanish() });
    expect(schema.parse({ enabled: 'false' }).enabled).toBe(false);
  });

  it('treats any other truthy string as true', () => {
    const schema = z.object({ enabled: booleanish() });
    expect(schema.parse({ enabled: 'true' }).enabled).toBe(true);
  });

  it('falls back to the provided default for null/undefined', () => {
    const schema = z.object({ enabled: booleanish(true) });
    expect(schema.parse({ enabled: null }).enabled).toBe(true);
    expect(schema.parse({ enabled: undefined }).enabled).toBe(true);
  });
});
