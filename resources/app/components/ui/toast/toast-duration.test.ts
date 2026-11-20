import { describe, expect, it } from 'vitest';

import { getToastDuration } from '@/components/ui/toast/toast-duration';

const wordsOf = (count: number) => {
  return Array.from({ length: count }, () => 'word').join(' ');
};

describe('getToastDuration', () => {
  it('gives a short success message the success default', () => {
    expect(getToastDuration({ variant: 'success', title: 'Brand saved now' })).toBe(4000);
  });

  it('adds reading time for a longer info message', () => {
    expect(getToastDuration({ variant: 'info', title: wordsOf(20) })).toBe(6500);
  });

  it('counts the title and the description together', () => {
    expect(
      getToastDuration({ variant: 'info', title: wordsOf(10), description: wordsOf(10) }),
    ).toBe(6500);
  });

  it('caps a very long warning at the warning maximum', () => {
    expect(getToastDuration({ variant: 'warning', title: wordsOf(60) })).toBe(10000);
  });

  it('uses the undo timing when the toast has Undo', () => {
    expect(getToastDuration({ variant: 'success', title: 'Brand deleted', hasUndo: true })).toBe(
      8000,
    );
  });

  it('gives an error 20 seconds', () => {
    expect(getToastDuration({ variant: 'error', title: 'Save failed' })).toBe(20000);
  });

  it('keeps 20 seconds for a long error', () => {
    expect(getToastDuration({ variant: 'error', title: wordsOf(90) })).toBe(20000);
  });

  it('keeps 20 seconds for an error with Undo', () => {
    expect(getToastDuration({ variant: 'error', title: 'Save failed', hasUndo: true })).toBe(20000);
  });

  it('gives a loading toast no timer, even with an explicit duration', () => {
    expect(
      getToastDuration({ variant: 'info', title: 'Importing', loading: true, duration: 3000 }),
    ).toBeNull();
  });

  it('uses an explicit duration exactly', () => {
    expect(getToastDuration({ variant: 'success', title: 'Saved', duration: 2000 })).toBe(2000);
  });

  it('uses an explicit duration on an error', () => {
    expect(getToastDuration({ variant: 'error', title: 'Save failed', duration: 3000 })).toBe(3000);
  });

  it('does not count an empty description as a word', () => {
    expect(getToastDuration({ variant: 'info', title: wordsOf(20), description: '   ' })).toBe(
      6500,
    );
  });
});
