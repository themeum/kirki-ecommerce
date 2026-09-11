import { describe, expect, it } from 'vitest';

import {
  buildIndex,
  search,
  type SearchDocumentInput,
} from './search-engine.mjs';

const document = (
  id: string,
  title: string,
  description: string,
  labels: string[] = [],
): SearchDocumentInput => ({
  id,
  pageKey: id.split('.')[0],
  route: `/settings/${id.split('.')[0]}`,
  pageTitle: id.split('.')[0],
  title,
  fields: [
    { kind: 'title', text: title },
    { kind: 'description', text: description },
    ...labels.map((label) => ({ kind: 'label' as const, text: label })),
  ],
});

const corpus = buildIndex([
  document(
    'payments.refunds',
    'Refunds',
    'Issue a refund to the customer using their original payment method.',
    ['Allow partial refunds', 'Restocking fee'],
  ),
  document(
    'currency.management',
    'Currency Management',
    'Choose which currencies your store accepts and how they are converted.',
    ['Base currency', 'Exchange rate provider'],
  ),
  document(
    'shipping.zones',
    'Shipping Zones',
    'Group the places you ship to and set a shipping rate for each of them.',
    ['Zone name', 'Shipping rate'],
  ),
  document(
    'shipping.pickup',
    'Local Pickup',
    'Let a buyer collect their parcel from you instead of arranging delivery.',
    ['Pickup instructions'],
  ),
  document(
    'checkout.guest',
    'Allow Guest Checkout',
    'Let customers buy without logging in or creating an account.',
    ['Require email address'],
  ),
  document(
    'products.units',
    'Standards',
    'Pick the units used to describe how heavy and how large a product is.',
    ['Weight unit', 'Dimension unit'],
  ),
]);

const idsFor = (query: string) => {
  return search(corpus, query).map((result) => result.id);
};

const scoreFor = (query: string, id: string) => {
  return search(corpus, query).find((result) => result.id === id)?.score ?? 0;
};

describe('settings search engine', () => {
  it('finds a document that shares no words with the query', () => {
    const results = idsFor('money back');

    expect(results[0]).toBe('payments.refunds');
    expect(Object.keys(corpus.documents[0].words)).not.toContain('money');
  });

  it('ranks a literal match above a related-term match', () => {
    expect(scoreFor('shipping', 'shipping.zones')).toBeGreaterThan(
      scoreFor('shipping', 'shipping.pickup'),
    );
  });

  it('matches a concept expressed with different words', () => {
    expect(idsFor('anonymous buyer without an account')).toContain(
      'checkout.guest',
    );
  });

  it('matches the same documents whatever case the query is typed in', () => {
    const lower = search(corpus, 'guest checkout');
    const upper = search(corpus, 'GUEST CHECKOUT');
    const mixed = search(corpus, 'GuEsT ChEcKoUt');

    expect(upper.map((result) => result.id)).toEqual(lower.map((result) => result.id));
    expect(mixed.map((result) => result.id)).toEqual(lower.map((result) => result.id));
    expect(upper[0].matchedTerms).toEqual(lower[0].matchedTerms);
    expect(upper[0].score).toBeCloseTo(lower[0].score);
  });

  it('returns nothing for an unrelated query', () => {
    expect(idsFor('quantum astrophysics telescope')).toEqual([]);
  });

  it('returns nothing for an empty or stopword-only query', () => {
    expect(idsFor('')).toEqual([]);
    expect(idsFor('   ')).toEqual([]);
    expect(idsFor('the and of')).toEqual([]);
  });

  it('reports the terms that produced the score', () => {
    const [result] = search(corpus, 'money back');

    expect(result.matchedTerms).toContain('refund');
    expect(result.matchedTerms.every((term) => !term.startsWith('~'))).toBe(true);
  });

  it('reports a literal term as matched', () => {
    const [result] = search(corpus, 'guest checkout');

    expect(result.id).toBe('checkout.guest');
    expect(result.matchedTerms).toContain('guest');
  });

  it('prefix-matches a single-letter query that has no semantic meaning', () => {
    const results = idsFor('c');

    expect(results).toContain('currency.management');
    expect(results).toContain('checkout.guest');
    expect(results).toContain('payments.refunds');
    expect(results).not.toContain('shipping.zones');
  });

  it('still returns nothing for a single letter that is a stopword', () => {
    expect(idsFor('a')).toEqual([]);
  });

  it('orders results by descending score', () => {
    const scores = search(corpus, 'shipping rate').map(
      (result) => result.score,
    );

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
