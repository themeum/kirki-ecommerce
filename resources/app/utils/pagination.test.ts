import { describe, expect, it } from 'vitest';

import { ELLIPSIS, getPageItems } from '@/utils/pagination';

describe('getPageItems', () => {
  it('shows every page when they all fit the window', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows a trailing ellipsis only when the current page is near the start', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 20]);
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 20]);
  });

  it('shows a leading ellipsis only when the current page is near the end', () => {
    expect(getPageItems(19, 20)).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20]);
    expect(getPageItems(20, 20)).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20]);
  });

  it('shows both ellipses when the current page is in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 20]);
  });

  it('keeps the window bounded for page counts in the thousands', () => {
    const items = getPageItems(500, 5000);

    expect(items).toEqual([1, ELLIPSIS, 499, 500, 501, ELLIPSIS, 5000]);
    expect(items.length).toBeLessThan(10);
  });
});
