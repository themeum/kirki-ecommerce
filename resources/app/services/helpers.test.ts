import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { isApiValidationError } from '@/schemas/shared/errors';
import { parseData, parseResponse, unwrapDataList } from '@/services/helpers';

const ItemSchema = z.object({ id: z.number(), name: z.string() });

const getThrownError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected function to throw');
};

describe('unwrapDataList', () => {
  it('returns an array response unchanged', () => {
    const response = { data: [{ id: 1 }, { id: 2 }] };

    expect(unwrapDataList(response)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('converts a keyed object into a list — PHP losing an associative array\'s integer keys', () => {
    const response = { data: { stripe: { id: 'stripe' }, paypal: { id: 'paypal' } } };

    expect(unwrapDataList(response)).toEqual([{ id: 'stripe' }, { id: 'paypal' }]);
  });

  it('resolves a null data field to an empty list', () => {
    expect(unwrapDataList({ data: null })).toEqual([]);
  });

  it('resolves an empty object to an empty list', () => {
    expect(unwrapDataList({ data: {} })).toEqual([]);
  });
});

describe('parseData schema mismatch', () => {
  it('returns the parsed value for a matching response', () => {
    const response = { data: { id: 1, name: 'Stripe' } };

    expect(parseData(ItemSchema, response)).toEqual({ id: 1, name: 'Stripe' });
  });

  it('reports a validation error rather than crashing when the item shape does not match', () => {
    const response = { data: { id: 'not-a-number' } };

    const error = getThrownError(() => parseData(ItemSchema, response));

    expect(isApiValidationError(error)).toBe(true);
  });

  it('reports a validation error rather than crashing when the envelope itself is missing', () => {
    const error = getThrownError(() => parseData(ItemSchema, undefined));

    expect(isApiValidationError(error)).toBe(true);
  });
});

describe('parseResponse schema mismatch', () => {
  it('returns the parsed envelope for a matching response', () => {
    const response = { success: true, message: '', data: { id: 1, name: 'Stripe' } };

    expect(parseResponse(ItemSchema, response).data).toEqual({ id: 1, name: 'Stripe' });
  });

  it('reports a validation error rather than crashing when the item shape does not match', () => {
    const response = { success: true, message: '', data: { id: 1 } };

    const error = getThrownError(() => parseResponse(ItemSchema, response));

    expect(isApiValidationError(error)).toBe(true);
  });

  it('reports a validation error rather than crashing on a raw non-object response', () => {
    const error = getThrownError(() => parseResponse(ItemSchema, 'unexpected string'));

    expect(isApiValidationError(error)).toBe(true);
  });
});
