import { describe, expect, it } from 'vitest';

import { ReviewFormSchema } from '@/features/reviews/schemas/forms/review-form';

describe('ReviewFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = ReviewFormSchema.parse({
      rating: 5,
      title: 'Amazing quality',
      content: 'Exceeded my expectations!',
      status: 'approved',
      admin_reply: 'Thank you for your review!',
    });

    expect(result).toEqual({
      rating: 5,
      title: 'Amazing quality',
      content: 'Exceeded my expectations!',
      status: 'approved',
      admin_reply: 'Thank you for your review!',
    });
  });

  it('sends null for empty title and admin_reply rather than empty strings', () => {
    const result = ReviewFormSchema.parse({
      rating: 4,
      title: '',
      content: 'Solid product.',
      status: 'pending',
      admin_reply: '',
    });

    expect(result.title).toBeNull();
    expect(result.admin_reply).toBeNull();
  });

  it('rejects an empty content', () => {
    expect(
      ReviewFormSchema.safeParse({
        rating: 5,
        title: 'Title',
        content: '   ',
        status: 'pending',
        admin_reply: '',
      }).success,
    ).toBe(false);
  });
});
