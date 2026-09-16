import { describe, expect, it } from 'vitest';

import { insertTokenAtCursor, slugToToken } from '@/features/settings/legal/lib/token-insert';

describe('slugToToken', () => {
  it('converts a dashed slug to an underscored token', () => {
    expect(slugToToken('privacy-policy')).toBe('{privacy_policy}');
  });

  it('passes a single-word slug through', () => {
    expect(slugToToken('terms')).toBe('{terms}');
  });

  it('leaves an already-underscored slug alone', () => {
    expect(slugToToken('privacy_policy')).toBe('{privacy_policy}');
  });

  it('converts every dash, not just the first', () => {
    expect(slugToToken('terms-and-conditions')).toBe('{terms_and_conditions}');
  });
});

describe('insertTokenAtCursor', () => {
  it('appends at the end when there is no selection', () => {
    expect(insertTokenAtCursor('Agree to ', '{terms}', null)).toEqual({
      text: 'Agree to {terms}',
      caret: 16,
    });
  });

  it('prepends when the caret is at position zero', () => {
    const result = insertTokenAtCursor('Agree', '{terms}', { start: 0, end: 0 });

    expect(result.text).toBe('{terms}Agree');
    expect(result.caret).toBe(7);
  });

  it('splices mid-string and returns the caret after the token', () => {
    const result = insertTokenAtCursor('Read the now', '{terms}', { start: 9, end: 9 });

    expect(result.text).toBe('Read the {terms}now');
    expect(result.caret).toBe(16);
  });

  it('replaces a non-empty selection', () => {
    const result = insertTokenAtCursor('Read the policy', '{terms}', { start: 9, end: 15 });

    expect(result.text).toBe('Read the {terms}');
    expect(result.caret).toBe(16);
  });

  it('clamps a stale selection past the end without mangling the text', () => {
    const result = insertTokenAtCursor('short', '{terms}', { start: 400, end: 900 });

    expect(result.text).toBe('short{terms}');
    expect(result.caret).toBe(12);
  });

  it('clamps a negative start', () => {
    const result = insertTokenAtCursor('abc', '{terms}', { start: -10, end: 2 });

    expect(result.text).toBe('{terms}c');
    expect(result.caret).toBe(7);
  });

  it('treats an end before the start as a collapsed caret', () => {
    const result = insertTokenAtCursor('abcdef', '{terms}', { start: 4, end: 1 });

    expect(result.text).toBe('abcd{terms}ef');
    expect(result.caret).toBe(11);
  });

  it('inserts into an empty message', () => {
    expect(insertTokenAtCursor('', '{terms}', null)).toEqual({ text: '{terms}', caret: 7 });
  });
});
