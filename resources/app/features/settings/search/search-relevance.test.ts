import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

import { search, type SearchIndex } from './search-engine.mjs';

const index = JSON.parse(
  fs.readFileSync(new URL('./settings-search-index.json', import.meta.url), 'utf8'),
) as SearchIndex;

const TOP_N = 3;

const topResults = (query: string) => {
  return search(index, query)
    .slice(0, TOP_N)
    .map((result) => result.id);
};

const relevant: [query: string, expected: string[]][] = [
  ['guest checkout', ['checkout.guest-checkout']],
  ['shipping zones', ['shipping.zones', 'nav.shipping']],
  ['tax regions', ['tax.regions']],
  ['store address', ['general.store-address']],
  ['invoice id', ['general.invoice-id']],
  ['barcode', ['essentials.barcode-generation']],
  ['reviews', ['products.reviews']],
  ['payment gateways', ['payments.online']],
  ['variation', ['essentials.variation-library']],
  ['structured data', ['essentials.schema-profile']],
  ['email template', ['email.default-template']],
  ['product weight unit', ['products.standards']],
  ['star ratings', ['products.reviews']],
  ['low stock threshold', ['products.standards']],
  ['postcode', ['general.store-address']],
  ['billing fields', ['checkout.configuration']],
  ['decimal separator', ['currency.format', 'currency.preferences']],
  ['sender name', ['email.default-template']],
  ['wordpress pages', ['advanced.pages']],
];

const related: [query: string, expected: string[]][] = [
  ['without an account', ['checkout.guest-checkout']],
  ['vat', ['nav.tax', 'tax.collection']],
  ['sales tax', ['tax.regions', 'nav.tax', 'tax.collection']],
  ['delivery', ['nav.shipping', 'shipping.zones']],
  ['terms and conditions', ['checkout.legal-information']],
  ['privacy policy', ['checkout.legal-information']],
  ['exchange rate', ['currency.management']],
  ['countries i sell to', ['general.selling-locations']],
  ['box size', ['shipping.boxes']],
  ['tax included in price', ['tax.collection']],
  ['digital wallet', ['payments.online']],
  ['bulky items', ['shipping.profiles']],
];

const misspelled: [query: string, expected: string[]][] = [
  ['shiping zones', ['shipping.zones', 'nav.shipping']],
  ['curency', ['currency.preferences', 'nav.currency', 'currency.format']],
  ['chekout', ['nav.checkout', 'checkout.guest-checkout']],
  ['adress', ['general.store-address']],
];

const partial: [query: string, expected: string[]][] = [
  ['shipp', ['nav.shipping', 'shipping.zones']],
  ['varia', ['essentials.variation-library']],
  ['curren', ['currency.preferences', 'nav.currency']],
  ['barcod', ['essentials.barcode-generation']],
  ['invoic', ['general.invoice-id']],
  ['guest ch', ['checkout.guest-checkout']],
];

const keyworded: [query: string, expected: string[]][] = [
  ['parcel', ['shipping.boxes']],
  ['gst', ['tax.regions', 'tax.profile', 'tax.collection', 'nav.tax']],
  ['bank transfer', ['payments.offline']],
  ['upc', ['essentials.barcode-generation']],
  ['seo', ['essentials.schema-profile']],
  ['cash on delivery', ['payments.offline']],
];

const literal: [query: string, expected: string[]][] = [
  ['va', ['essentials.variation-library', 'tax.regions']],
  ['va zo', ['tax.regions']],
  ['gtin', ['essentials.barcode-generation']],
];

const absent = [
  'money back',
  'refund',
  'loyalty points program',
  'wishlist',
  'quantum astrophysics telescope',
  'zzzz',
  'the and of',
  'va qq',
];

const matchesOneOf = (query: string, expected: string[]) => {
  return topResults(query).filter((id) => expected.includes(id));
};

describe('settings search relevance', () => {
  it.each(relevant)('finds the card named by "%s"', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(related)('finds the setting meant by "%s"', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(misspelled)('recovers from the typo in "%s"', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(partial)('answers the half-typed "%s"', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(keyworded)('finds the card declaring "%s" as a keyword', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(literal)('falls back to literal matching for "%s"', (query, expected) => {
    expect(matchesOneOf(query, expected)).not.toHaveLength(0);
  });

  it.each(absent)('returns nothing for "%s", which no setting covers', (query) => {
    expect(search(index, query)).toEqual([]);
  });

  it('prefers the card named for a word over one that only lists it', () => {
    const ranked = topResults('variation');

    expect(ranked[0]).toBe('essentials.variation-library');
  });

  it('drops a card that matches only part of a multi-word query', () => {
    expect(topResults('digital wallet')).toEqual(['payments.online']);
  });

  it('does not append literal matches to a query that already found something', () => {
    const results = search(index, 'guest checkout');

    expect(results.every((result) => result.matchedPrefixes === undefined)).toBe(true);
  });
});
