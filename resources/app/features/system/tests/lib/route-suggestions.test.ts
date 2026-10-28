import { describe, expect, it } from 'vitest';

import { getDestinations, getRouteSuggestions } from '@/features/system/lib/route-suggestions';

const ids = (pathname: string) => getRouteSuggestions(pathname).map(({ id }) => id);

describe('getRouteSuggestions', () => {
  it('suggests the exact destination first', () => {
    expect(ids('/orders/unknown')[0]).toBe('orders');
  });

  it('matches partial segments', () => {
    expect(ids('/prod')).toEqual(['products']);
  });

  it('tolerates a single typo', () => {
    expect(ids('/prodcts')).toEqual(['products']);
  });

  it('matches keywords inside hyphenated segments', () => {
    expect(ids('/stock-levels')).toEqual(['inventory']);
  });

  it('returns nothing for unrelated paths', () => {
    expect(ids('/zzzzzz')).toEqual([]);
  });

  it('returns at most three suggestions', () => {
    expect(getRouteSuggestions('/orders/products/coupons/customers').length).toBe(3);
  });
});

describe('getDestinations', () => {
  it('builds a link for every destination', () => {
    getDestinations().forEach(({ link }) => expect(link.startsWith('/')).toBe(true));
  });
});
