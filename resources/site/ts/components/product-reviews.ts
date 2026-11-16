/**
 * Product Reviews Alpine Component
 *
 * @package Kirki\Ecommerce\Site
 * @since 1.0.1
 */

import { reviewsApi, type ReviewResponseItem } from '../api/reviews';
import { toastManager } from '../services/toast/runtime';

export interface ProductReviewsConfig {
  productId: number;
  canReview: boolean;
  alreadyReviewed: boolean;
  rating?: number;
  authorName?: string;
  authorEmail?: string;
  title?: string;
  content?: string;
  reviews?: ReviewResponseItem[];
  ratingBreakdown?: Record<number, number>;
  reviewsCount?: number;
}

export function productReviews(config: ProductReviewsConfig) {
  const { __ } = window.wp?.i18n || {
    __: (msg: string) => msg,
  };

  return {
    productId: config.productId,
    showForm: false,
    isEditing: config.alreadyReviewed,
    canReview: config.canReview,
    alreadyReviewed: config.alreadyReviewed,
    rating: config.rating || 5,
    hoverRating: 0,
    author_name: config.authorName || '',
    author_email: config.authorEmail || '',
    title: config.title || '',
    content: config.content || '',
    loading: false,
    submitted: false,
    errorMessage: '',
    successMessage: '',
    filterRating: 'all' as string | number,
    sortBy: 'newest' as 'newest' | 'highest' | 'lowest' | 'helpful',
    visibleCount: 5,
    votedIds: [] as number[],
    allReviews: config.reviews || [],
    ratingBreakdown: config.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviewsTotal: config.reviewsCount || (config.reviews ? config.reviews.length : 0),

    setRating(val: number) {
      this.rating = val;
    },

    get filteredReviews(): ReviewResponseItem[] {
      let list = [...this.allReviews];
      if (this.filterRating !== 'all') {
        const targetRating = Number(this.filterRating);
        list = list.filter((r) => Number(r.rating) === targetRating);
      }
      if (this.sortBy === 'newest') {
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
      } else if (this.sortBy === 'highest') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (this.sortBy === 'lowest') {
        list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      } else if (this.sortBy === 'helpful') {
        list.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      }
      return list;
    },

    get visibleReviews(): ReviewResponseItem[] {
      return this.filteredReviews.slice(0, this.visibleCount);
    },

    async voteHelpful(revId: number) {
      if (this.votedIds.includes(revId)) {
        return;
      }

      try {
        const response = await reviewsApi.voteHelpful(revId);
        this.votedIds.push(revId);
        const target = this.allReviews.find((x) => x.id === revId);
        if (target) {
          target.helpful_count = response.data?.helpful_count ?? (target.helpful_count || 0) + 1;
        }
        toastManager.success(__('Thank you for your feedback.', 'kirki-ecommerce'));
      } catch (err: any) {
        console.error('Error voting helpful:', err);
        toastManager.error(__('Could not record vote. Please try again.', 'kirki-ecommerce'));
      }
    },

    async submitReview() {
      if (!this.author_name || !this.author_email || !this.content) {
        this.errorMessage = __('Please fill in all required fields.', 'kirki-ecommerce');
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const response = await reviewsApi.submitReview(this.productId, {
          product_id: this.productId,
          rating: this.rating,
          title: this.title,
          content: this.content,
          author_name: this.author_name,
          author_email: this.author_email,
        });

        this.submitted = true;
        this.showForm = false;
        this.alreadyReviewed = true;
        this.successMessage =
          response.message ||
          __('Thank you! Your review has been submitted for moderation.', 'kirki-ecommerce');
        toastManager.success(this.successMessage);
      } catch (err: any) {
        console.error('Error submitting review:', err);
        this.errorMessage =
          err.message || __('Failed to submit review. Please check your inputs.', 'kirki-ecommerce');
        toastManager.error(this.errorMessage);
      } finally {
        this.loading = false;
      }
    },
  };
}
