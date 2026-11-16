/**
 * Storefront Reviews API
 *
 * @package Kirki\Ecommerce\Site
 * @since 1.0.1
 */

import { apiRequest } from './client';
import { ENDPOINTS } from './endpoints';

export interface CreateReviewPayload {
  product_id: number;
  rating: number;
  title?: string;
  content: string;
  author_name: string;
  author_email: string;
}

export interface ReviewResponseItem {
  id: number;
  author_name: string;
  rating: number;
  title?: string;
  content: string;
  is_verified_purchase: boolean;
  admin_reply?: string;
  admin_replied_at?: string;
  helpful_count: number;
  created_at: string;
}

export interface ReviewsSummary {
  average_rating: number;
  reviews_count: number;
  rating_breakdown: Record<number, number>;
}

export interface ProductReviewsResponse {
  data: {
    reviews: ReviewResponseItem[];
    summary: ReviewsSummary;
  };
  message: string;
}

export const reviewsApi = {
  getProductReviews(productId: number): Promise<ProductReviewsResponse> {
    return apiRequest<ProductReviewsResponse>(ENDPOINTS.shop.productReviews(productId), {
      method: 'GET',
    });
  },

  submitReview(productId: number, payload: CreateReviewPayload): Promise<{ data: ReviewResponseItem; message: string }> {
    return apiRequest<{ data: ReviewResponseItem; message: string }>(ENDPOINTS.shop.productReviews(productId), {
      method: 'POST',
      body: payload,
    });
  },

  voteHelpful(reviewId: number): Promise<{ data: { id: number; helpful_count: number }; message: string }> {
    return apiRequest<{ data: { id: number; helpful_count: number }; message: string }>(ENDPOINTS.shop.voteHelpful(reviewId), {
      method: 'POST',
    });
  },
};
