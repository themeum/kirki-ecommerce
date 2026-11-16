<?php

/**
 * Product Reviews Part Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.1
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Review;
use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$product = $data['product'] ?? [];
$product_id = (int) ($product['id'] ?? 0);
$reviews = $product['reviews'] ?? [];
$reviews_count = (int) ($product['reviews_count'] ?? count($reviews));
$average_rating = (float) ($product['average_rating'] ?? 0);
$is_logged_in = is_user_logged_in();
$current_user = wp_get_current_user();
$default_name = $is_logged_in ? ($current_user->display_name ?: $current_user->user_nicename) : '';
$default_email = $is_logged_in ? $current_user->user_email : '';

$review_eligibility = $product['review_eligibility'] ?? Review::check_user_eligibility(
    $product_id,
    $is_logged_in ? (int) $current_user->ID : null,
    $is_logged_in ? $current_user->user_email : null
);

$can_review = !empty($review_eligibility['can_review']);
$already_reviewed = !empty($review_eligibility['already_reviewed']);
$eligibility_reason = $review_eligibility['reason'] ?? ($is_logged_in ? 'not_purchased' : 'not_logged_in');
$eligibility_message = $review_eligibility['message'] ?? '';

?>

<div class="kecom-reviews-container" x-data="{
    showForm: false,
    canReview: <?php echo $can_review ? 'true' : 'false'; ?>,
    alreadyReviewed: <?php echo $already_reviewed ? 'true' : 'false'; ?>,
    rating: 5,
    hoverRating: 0,
    author_name: '<?php echo esc_js($default_name); ?>',
    author_email: '<?php echo esc_js($default_email); ?>',
    title: '',
    content: '',
    loading: false,
    submitted: false,
    errorMessage: '',
    successMessage: '',
    setRating(val) {
        this.rating = val;
    },
    async submitReview() {
        if (!this.canReview) {
            this.errorMessage = '<?php echo esc_js(__('Only verified buyers with delivered orders can submit a review.', 'kirki-ecommerce')); ?>';
            return;
        }
        if (this.alreadyReviewed) {
            this.errorMessage = '<?php echo esc_js(__('You have already submitted a review for this product.', 'kirki-ecommerce')); ?>';
            return;
        }
        if (!this.rating || this.rating < 1 || this.rating > 5) {
            this.errorMessage = '<?php echo esc_js(__('Please choose a star rating from 1 to 5.', 'kirki-ecommerce')); ?>';
            return;
        }
        if (!this.author_name.trim()) {
            this.errorMessage = '<?php echo esc_js(__('Please enter your name.', 'kirki-ecommerce')); ?>';
            return;
        }
        if (!this.author_email.trim() || !this.author_email.includes('@')) {
            this.errorMessage = '<?php echo esc_js(__('Please enter a valid email address.', 'kirki-ecommerce')); ?>';
            return;
        }
        if (!this.content.trim()) {
            this.errorMessage = '<?php echo esc_js(__('Please write your review.', 'kirki-ecommerce')); ?>';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        try {
            const endpoint = '<?php echo esc_url(rest_url('kirki/ecommerce/v1/shop/products/' . $product_id . '/reviews')); ?>';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
                },
                body: JSON.stringify({
                    product_id: <?php echo $product_id; ?>,
                    rating: this.rating,
                    author_name: this.author_name.trim(),
                    author_email: this.author_email.trim(),
                    title: this.title.trim(),
                    content: this.content.trim()
                })
            });

            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.message || '<?php echo esc_js(__('Failed to submit review. Please try again.', 'kirki-ecommerce')); ?>');
            }

            this.submitted = true;
            this.alreadyReviewed = true;
            this.successMessage = resData.message || '<?php echo esc_js(__('Thank you! Your review has been submitted.', 'kirki-ecommerce')); ?>';
            this.content = '';
            this.title = '';
        } catch (err) {
            this.errorMessage = err.message || '<?php echo esc_js(__('An error occurred while submitting your review.', 'kirki-ecommerce')); ?>';
        } finally {
            this.loading = false;
        }
    }
}">
    <!-- Reviews Header & Summary -->
    <div class="kecom-reviews-header">
        <div class="kecom-reviews-score">
            <span class="kecom-score-number"><?php echo esc_html(number_format($average_rating, 1)); ?></span>
            <div class="kecom-score-meta">
                <div class="kecom-stars" aria-label="<?php echo esc_attr(sprintf(__('%s out of 5 stars', 'kirki-ecommerce'), $average_rating)); ?>">
                    <?php for ($i = 1; $i <= 5; $i++) : ?>
                        <span class="<?php echo $i <= round($average_rating) ? 'star-filled' : 'star-empty'; ?>">
                            <?php echo $i <= round($average_rating) ? '★' : '☆'; ?>
                        </span>
                    <?php endfor; ?>
                </div>
                <span class="kecom-count">
                    <?php
                    if ($reviews_count > 0) {
                        printf(
                            esc_html(_n('Based on %d review', 'Based on %d reviews', $reviews_count, 'kirki-ecommerce')),
                            $reviews_count
                        );
                    } else {
                        esc_html_e('No reviews yet', 'kirki-ecommerce');
                    }
                    ?>
                </span>
            </div>
        </div>

        <div class="kecom-reviews-header-action">
            <?php if (!$is_logged_in) : ?>
                <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                    <?php esc_html_e('Log in to Review', 'kirki-ecommerce'); ?>
                </a>
            <?php elseif ($can_review && !$already_reviewed) : ?>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-primary"
                    @click="showForm = !showForm"
                    x-text="showForm ? '<?php echo esc_js(__('Close Form', 'kirki-ecommerce')); ?>' : '<?php echo esc_js(__('Write a Review', 'kirki-ecommerce')); ?>'"
                >
                    <?php esc_html_e('Write a Review', 'kirki-ecommerce'); ?>
                </button>
            <?php elseif ($can_review && $already_reviewed) : ?>
                <span class="kecom-eligibility-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background-color: #ecfdf5; color: #065f46; font-size: 13px; font-weight: 500;">
                    ✓ <?php esc_html_e('You reviewed this product', 'kirki-ecommerce'); ?>
                </span>
            <?php elseif ($eligibility_reason === 'not_delivered') : ?>
                <span class="kecom-eligibility-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background-color: #fef3c7; color: #92400e; font-size: 13px; font-weight: 500;">
                    🚚 <?php esc_html_e('Delivery pending', 'kirki-ecommerce'); ?>
                </span>
            <?php else : ?>
                <span class="kecom-eligibility-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background-color: #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;" title="<?php echo esc_attr($eligibility_message); ?>">
                    🔒 <?php esc_html_e('Verified buyers only', 'kirki-ecommerce'); ?>
                </span>
            <?php endif; ?>
        </div>
    </div>

    <!-- Eligibility Notice Banner -->
    <?php if (!$is_logged_in) : ?>
        <div class="kecom-review-banner" style="margin-top: 16px; padding: 12px 16px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-size: 14px; color: #475569; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span><?php esc_html_e('Only customers who purchased and received this product can write a review.', 'kirki-ecommerce'); ?></span>
            <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" style="color: #2563eb; font-weight: 500; text-decoration: underline;">
                <?php esc_html_e('Log in to your account', 'kirki-ecommerce'); ?> &rarr;
            </a>
        </div>
    <?php elseif ($can_review && $already_reviewed) : ?>
        <div class="kecom-review-banner" style="margin-top: 16px; padding: 12px 16px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; font-size: 14px; color: #166534;">
            <strong>✓ <?php esc_html_e('Thank you for your feedback!', 'kirki-ecommerce'); ?></strong> <?php esc_html_e('You have already submitted a review for this delivered product.', 'kirki-ecommerce'); ?>
        </div>
    <?php elseif ($is_logged_in && !$can_review) : ?>
        <?php if ($eligibility_reason === 'not_delivered') : ?>
            <div class="kecom-review-banner" style="margin-top: 16px; padding: 12px 16px; border-radius: 8px; background-color: #fffbeb; border: 1px solid #fde68a; font-size: 14px; color: #92400e;">
                <strong><?php esc_html_e('Delivery Pending:', 'kirki-ecommerce'); ?></strong> <?php esc_html_e('You have ordered this product, but the delivery has not completed yet. You can submit your review once your order is delivered.', 'kirki-ecommerce'); ?>
            </div>
        <?php else : ?>
            <div class="kecom-review-banner" style="margin-top: 16px; padding: 12px 16px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
                <strong><?php esc_html_e('Verified Purchase Required:', 'kirki-ecommerce'); ?></strong> <?php esc_html_e('Only customers who have purchased and received this product can write a review.', 'kirki-ecommerce'); ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>

    <!-- Review Form Card (only accessible for eligible delivered buyers) -->
    <?php if ($can_review) : ?>
        <div class="kecom-review-form-card" x-show="showForm || submitted" x-transition x-cloak>
            <template x-if="submitted">
                <div class="kecom-alert kecom-alert-success" style="padding: 16px; border-radius: 8px; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; display: flex; align-items: center; justify-content: space-between;">
                    <span x-text="successMessage"></span>
                    <button type="button" class="kecom-btn kecom-btn-sm kecom-btn-outline" style="margin-left: 12px;" @click="submitted = false; showForm = false;">
                        <?php esc_html_e('Dismiss', 'kirki-ecommerce'); ?>
                    </button>
                </div>
            </template>

            <template x-if="!submitted">
                <form @submit.prevent="submitReview" class="kecom-form">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <h3 class="kecom-form-title" style="margin: 0;"><?php esc_html_e('Write a Review', 'kirki-ecommerce'); ?></h3>
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 500;">
                            ✓ <?php esc_html_e('Verified Buyer (Delivered)', 'kirki-ecommerce'); ?>
                        </span>
                    </div>

                    <!-- Error notice -->
                    <div class="kecom-alert kecom-alert-danger" x-show="errorMessage" x-text="errorMessage" style="padding: 12px 16px; border-radius: 6px; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; margin-bottom: 12px;"></div>

                    <!-- Rating Selector -->
                    <div class="kecom-field">
                        <label class="kecom-field-label"><?php esc_html_e('Your Rating', 'kirki-ecommerce'); ?> <span style="color: #ef4444;">*</span></label>
                        <div class="kecom-rating-selector">
                            <div class="kecom-stars-input" @mouseleave="hoverRating = 0">
                                <?php for ($star = 1; $star <= 5; $star++) : ?>
                                    <button
                                        type="button"
                                        aria-label="<?php echo esc_attr(sprintf(__('Rate %d out of 5 stars', 'kirki-ecommerce'), $star)); ?>"
                                        @mouseover="hoverRating = <?php echo $star; ?>"
                                        @click="setRating(<?php echo $star; ?>)"
                                        :style="{ color: (hoverRating || rating) >= <?php echo $star; ?> ? '#f59e0b' : '#d1d5db' }"
                                    >
                                        ★
                                    </button>
                                <?php endfor; ?>
                            </div>
                            <span class="kecom-rating-label" x-text="['', '<?php echo esc_js(__('Poor', 'kirki-ecommerce')); ?>', '<?php echo esc_js(__('Fair', 'kirki-ecommerce')); ?>', '<?php echo esc_js(__('Good', 'kirki-ecommerce')); ?>', '<?php echo esc_js(__('Very Good', 'kirki-ecommerce')); ?>', '<?php echo esc_js(__('Excellent', 'kirki-ecommerce')); ?>'][hoverRating || rating] || ''"></span>
                        </div>
                    </div>

                    <!-- Review Title -->
                    <div class="kecom-field">
                        <label class="kecom-field-label" for="review-title"><?php esc_html_e('Review Title', 'kirki-ecommerce'); ?></label>
                        <input
                            type="text"
                            id="review-title"
                            class="kecom-input"
                            x-model="title"
                            placeholder="<?php esc_attr_e('Give your review a headline (optional)', 'kirki-ecommerce'); ?>"
                            maxlength="255"
                        />
                    </div>

                    <!-- Review Content -->
                    <div class="kecom-field">
                        <label class="kecom-field-label" for="review-content"><?php esc_html_e('Review', 'kirki-ecommerce'); ?> <span style="color: #ef4444;">*</span></label>
                        <textarea
                            id="review-content"
                            class="kecom-textarea"
                            rows="4"
                            x-model="content"
                            required
                            placeholder="<?php esc_attr_e('Write your review here. What did you like or dislike? How was the quality?', 'kirki-ecommerce'); ?>"
                            maxlength="5000"
                        ></textarea>
                    </div>

                    <!-- Author Details (pre-filled from verified customer account) -->
                    <div class="kecom-form-row">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="review-author-name"><?php esc_html_e('Name', 'kirki-ecommerce'); ?> <span style="color: #ef4444;">*</span></label>
                            <input
                                type="text"
                                id="review-author-name"
                                class="kecom-input"
                                x-model="author_name"
                                required
                                placeholder="<?php esc_attr_e('Your name', 'kirki-ecommerce'); ?>"
                                maxlength="255"
                            />
                        </div>
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="review-author-email"><?php esc_html_e('Email', 'kirki-ecommerce'); ?> <span style="color: #ef4444;">*</span></label>
                            <input
                                type="email"
                                id="review-author-email"
                                class="kecom-input"
                                x-model="author_email"
                                required
                                readonly
                                style="background-color: #f8fafc; cursor: not-allowed;"
                                title="<?php esc_attr_e('Email is locked to your verified account', 'kirki-ecommerce'); ?>"
                            />
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
                        <button
                            type="submit"
                            class="kecom-btn kecom-btn-primary"
                            :disabled="loading"
                            :class="{ 'kecom-btn-loading': loading }"
                        >
                            <span x-show="!loading"><?php esc_html_e('Submit Review', 'kirki-ecommerce'); ?></span>
                            <span x-show="loading" x-cloak><?php esc_html_e('Submitting...', 'kirki-ecommerce'); ?></span>
                        </button>
                    </div>
                </form>
            </template>
        </div>
    <?php endif; ?>

    <!-- Reviews List -->
    <?php if ($reviews_count > 0 && !empty($reviews)) : ?>
        <div class="kecom-reviews-list">
            <?php foreach ($reviews as $rev) :
                $rating_val = (int) ($rev['rating'] ?? 5);
                $initial = strtoupper(mb_substr($rev['author_name'] ?? 'U', 0, 1));
                ?>
                <div class="kecom-review-card">
                    <div class="kecom-review-meta">
                        <div class="kecom-author-info">
                            <div class="kecom-author-avatar">
                                <?php echo esc_html($initial); ?>
                            </div>
                            <div>
                                <span class="kecom-author-name"><?php echo esc_html($rev['author_name']); ?></span>
                                <?php if (!empty($rev['is_verified_purchase'])) : ?>
                                    <span class="kecom-verified-badge">
                                        ✓ <?php esc_html_e('Verified Buyer', 'kirki-ecommerce'); ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php if (!empty($rev['created_at'])) : ?>
                            <span class="kecom-review-date"><?php echo esc_html($rev['created_at']); ?></span>
                        <?php endif; ?>
                    </div>

                    <div class="kecom-review-stars" aria-label="<?php echo esc_attr(sprintf(__('%d out of 5 stars', 'kirki-ecommerce'), $rating_val)); ?>">
                        <?php for ($i = 1; $i <= 5; $i++) : ?>
                            <span class="<?php echo $i <= $rating_val ? 'star-filled' : 'star-empty'; ?>">
                                <?php echo $i <= $rating_val ? '★' : '☆'; ?>
                            </span>
                        <?php endfor; ?>
                    </div>

                    <?php if (!empty($rev['title'])) : ?>
                        <h4 class="kecom-review-title"><?php echo esc_html($rev['title']); ?></h4>
                    <?php endif; ?>

                    <p class="kecom-review-content"><?php echo nl2br(esc_html($rev['content'])); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <div class="kecom-reviews-empty" x-show="!submitted">
            <div class="kecom-empty-icon">★</div>
            <h4><?php esc_html_e('No reviews yet', 'kirki-ecommerce'); ?></h4>
            <p>
                <?php if ($can_review && !$already_reviewed) : ?>
                    <?php esc_html_e('You have purchased this product! Be the first verified buyer to share your review.', 'kirki-ecommerce'); ?>
                <?php else : ?>
                    <?php esc_html_e('Only verified buyers with delivered orders can leave a review for this product.', 'kirki-ecommerce'); ?>
                <?php endif; ?>
            </p>
            <?php if ($can_review && !$already_reviewed) : ?>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-outline"
                    @click="showForm = true"
                    x-show="!showForm"
                >
                    <?php esc_html_e('Leave a Review', 'kirki-ecommerce'); ?>
                </button>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
