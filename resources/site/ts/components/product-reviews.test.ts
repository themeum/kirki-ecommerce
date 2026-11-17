import { describe, expect, it, vi } from 'vitest';

import { productReviews } from './product-reviews';

vi.mock('../services/toast/runtime', () => ({
  toastManager: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('productReviews component', () => {
  it('initializes with default values', () => {
    const comp = productReviews({
      productId: 10,
      canReview: true,
      alreadyReviewed: false,
      reviews: [
        {
          id: 1,
          author_name: 'John',
          rating: 5,
          title: 'Great product',
          content: 'Really loved it',
          is_verified_purchase: true,
          helpful_count: 2,
          created_at: '2026-11-16',
        },
        {
          id: 2,
          author_name: 'Jane',
          rating: 3,
          title: 'Average',
          content: 'It was okay',
          is_verified_purchase: true,
          helpful_count: 0,
          created_at: '2026-11-15',
        },
      ],
      ratingBreakdown: { 5: 1, 4: 0, 3: 1, 2: 0, 1: 0 },
      reviewsCount: 2,
    });

    expect(comp.productId).toBe(10);
    expect(comp.canReview).toBe(true);
    expect(comp.alreadyReviewed).toBe(false);
    expect(comp.allReviews.length).toBe(2);
    expect(comp.visibleReviews.length).toBe(2);
  });

  it('filters reviews by star rating', () => {
    const comp = productReviews({
      productId: 10,
      canReview: false,
      alreadyReviewed: false,
      reviews: [
        {
          id: 1,
          author_name: 'John',
          rating: 5,
          content: 'Good',
          is_verified_purchase: true,
          helpful_count: 0,
          created_at: '2026-11-16',
        },
        {
          id: 2,
          author_name: 'Jane',
          rating: 3,
          content: 'Average',
          is_verified_purchase: true,
          helpful_count: 0,
          created_at: '2026-11-15',
        },
      ],
    });

    comp.filterRating = 5;
    expect(comp.filteredReviews.length).toBe(1);
    expect(comp.filteredReviews[0].rating).toBe(5);

    comp.filterRating = 'all';
    expect(comp.filteredReviews.length).toBe(2);
  });

  it('sorts reviews correctly', () => {
    const comp = productReviews({
      productId: 10,
      canReview: false,
      alreadyReviewed: false,
      reviews: [
        {
          id: 1,
          author_name: 'A',
          rating: 3,
          content: 'Low',
          is_verified_purchase: true,
          helpful_count: 10,
          created_at: '2026-11-14',
        },
        {
          id: 2,
          author_name: 'B',
          rating: 5,
          content: 'High',
          is_verified_purchase: true,
          helpful_count: 2,
          created_at: '2026-11-16',
        },
      ],
    });

    comp.sortBy = 'highest';
    expect(comp.filteredReviews[0].rating).toBe(5);

    comp.sortBy = 'lowest';
    expect(comp.filteredReviews[0].rating).toBe(3);

    comp.sortBy = 'helpful';
    expect(comp.filteredReviews[0].helpful_count).toBe(10);
  });

  it('sets rating value', () => {
    const comp = productReviews({
      productId: 10,
      canReview: true,
      alreadyReviewed: false,
    });

    comp.setRating(4);
    expect(comp.rating).toBe(4);
  });
});
