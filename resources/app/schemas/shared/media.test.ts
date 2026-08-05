import { describe, expect, it } from 'vitest';

import { MediaRefSchema } from '@/schemas/shared/media';

describe('MediaRefSchema', () => {
  it('accepts the raw shape WordPress media library attachments return', () => {
    const result = MediaRefSchema.safeParse({
      id: 24,
      url: 'http://example.com/image.jpg',
      mime: 'image/jpeg',
      type: 'image',
      date: new Date('2026-08-03T10:58:00Z'),
    });
    expect(result.success).toBe(true);
  });

  it('accepts a raw millisecond timestamp for date, matching the query-attachments AJAX response', () => {
    const result = MediaRefSchema.safeParse({
      id: 24,
      url: 'http://example.com/image.jpg',
      date: 1785765793000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an ISO date string, matching the REST API response', () => {
    const result = MediaRefSchema.safeParse({
      id: 24,
      url: 'http://example.com/image.jpg',
      date: '2026-08-03T10:58:00+00:00',
    });
    expect(result.success).toBe(true);
  });
});
