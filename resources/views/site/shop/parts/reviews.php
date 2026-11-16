<?php

/**
 * Product Reviews Part Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.1
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\ReviewService;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$product = $data['product'] ?? [];
$product_id = (int) ($product['id'] ?? 0);
$reviews = $product['reviews'] ?? [];
$reviews_count = (int) ($product['reviews_count'] ?? count($reviews));
$average_rating = (float) ($product['average_rating'] ?? 0);
$rating_breakdown = $product['rating_breakdown'] ?? [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
$is_logged_in = is_user_logged_in();
$current_user = wp_get_current_user();
$default_name = $is_logged_in ? ($current_user->display_name ?: $current_user->user_nicename) : '';
$default_email = $is_logged_in ? $current_user->user_email : '';

$review_eligibility = $product['review_eligibility'] ?? app(ReviewService::class)->check_eligibility(
    $product_id,
    $is_logged_in ? (int) $current_user->ID : null,
    $is_logged_in ? $current_user->user_email : null
);

$can_review = !empty($review_eligibility['can_review']);
$already_reviewed = !empty($review_eligibility['already_reviewed']);
$existing_review = $review_eligibility['existing_review'] ?? null;
$eligibility_reason = $review_eligibility['reason'] ?? ($is_logged_in ? 'not_purchased' : 'not_logged_in');
$eligibility_message = $review_eligibility['message'] ?? '';

$review_config = [
    'productId'       => $product_id,
    'canReview'       => $can_review,
    'alreadyReviewed' => $already_reviewed,
    'rating'          => !empty($existing_review['rating']) ? (int) $existing_review['rating'] : 5,
    'authorName'      => $default_name,
    'authorEmail'     => $default_email,
    'title'           => !empty($existing_review['title']) ? (string) $existing_review['title'] : '',
    'content'         => !empty($existing_review['content']) ? (string) $existing_review['content'] : '',
    'reviews'         => $reviews,
    'ratingBreakdown' => $rating_breakdown,
    'reviewsCount'    => $reviews_count,
];

?>

<div class="kecom-reviews-container" x-data="productReviews(<?php echo esc_attr(wp_json_encode($review_config)); ?>)">
    <!-- Header Summary & Rating Breakdown -->
    <div class="kecom-reviews-header">
        <div class="kecom-reviews-summary">
            <div class="kecom-rating-score-box">
                <span class="kecom-rating-score"><?php echo esc_html(number_format($average_rating, 1)); ?></span>
                <div class="kecom-rating-stars-large">
                    <?php for ($i = 1; $i <= 5; $i++) : ?>
                        <span class="<?php echo $i <= round($average_rating) ? 'star-filled' : 'star-empty'; ?>">★</span>
                    <?php endfor; ?>
                </div>
                <span class="kecom-rating-count">
                    <?php
                    /* translators: %d: number of customer reviews */
                    echo esc_html(sprintf(_n('Based on %d review', 'Based on %d reviews', $reviews_count, 'kirki-ecommerce'), $reviews_count));
                    ?>
                </span>
            </div>

            <!-- Star Distribution Breakdown Bars -->
            <div class="kecom-rating-breakdown-bars">
                <?php foreach ([5, 4, 3, 2, 1] as $star) : ?>
                    <?php
                    $count = (int) ($rating_breakdown[$star] ?? 0);
                    $percentage = $reviews_count > 0 ? round(($count / $reviews_count) * 100) : 0;
                    ?>
                    <div class="kecom-breakdown-row" @click="filterRating = (filterRating == <?php echo $star; ?> ? 'all' : <?php echo $star; ?>)">
                        <span class="kecom-breakdown-label"><?php echo esc_html(sprintf(__('%d star', 'kirki-ecommerce'), $star)); ?></span>
                        <div class="kecom-breakdown-track">
                            <div class="kecom-breakdown-fill" style="width: <?php echo esc_attr($percentage); ?>%;"></div>
                        </div>
                        <span class="kecom-breakdown-val"><?php echo esc_html($count); ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Call to Action button or Eligibility notice -->
        <div class="kecom-reviews-cta">
            <?php if ($can_review && !$already_reviewed) : ?>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-primary"
                    @click="showForm = !showForm"
                    x-text="showForm ? '<?php echo esc_js(__('Close Review Form', 'kirki-ecommerce')); ?>' : '<?php echo esc_js(__('Write a Review', 'kirki-ecommerce')); ?>'"
                >
                    <?php esc_html_e('Write a Review', 'kirki-ecommerce'); ?>
                </button>
            <?php elseif ($can_review && $already_reviewed) : ?>
                <div class="kecom-eligibility-badge verified">
                    ✓ <?php esc_html_e('You reviewed this item', 'kirki-ecommerce'); ?>
                </div>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-outline"
                    @click="showForm = !showForm; isEditing = true"
                    style="margin-top: 8px;"
                    x-text="showForm ? '<?php echo esc_js(__('Close Form', 'kirki-ecommerce')); ?>' : '<?php echo esc_js(__('Edit Your Review', 'kirki-ecommerce')); ?>'"
                >
                    <?php esc_html_e('Edit Your Review', 'kirki-ecommerce'); ?>
                </button>
            <?php else : ?>
                <div class="kecom-eligibility-notice">
                    <span class="kecom-eligibility-icon">🔒</span>
                    <div class="kecom-eligibility-text">
                        <strong><?php esc_html_e('Verified Buyer Review Policy', 'kirki-ecommerce'); ?></strong>
                        <p>
                            <?php if (!$is_logged_in) : ?>
                                <?php
                                $login_url = wp_login_url(get_permalink());
                                printf(
                                    /* translators: %s: login URL */
                                    __('Please <a href="%s">log in</a> with your account to submit a review for items you have received.', 'kirki-ecommerce'),
                                    esc_url($login_url)
                                );
                                ?>
                            <?php else : ?>
                                <?php echo esc_html($eligibility_message); ?>
                            <?php endif; ?>
                        </p>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Review Form Drawer / Collapsible -->
    <?php if ($can_review) : ?>
        <div class="kecom-review-form-wrapper" x-show="showForm" x-cloak x-transition>
            <div class="kecom-review-form-header">
                <h3 x-text="isEditing ? '<?php echo esc_js(__('Update Your Review', 'kirki-ecommerce')); ?>' : '<?php echo esc_js(__('Write a Customer Review', 'kirki-ecommerce')); ?>'">
                    <?php esc_html_e('Write a Customer Review', 'kirki-ecommerce'); ?>
                </h3>
                <span class="kecom-verified-buyer-pill">
                    ✓ <?php esc_html_e('Verified Purchase', 'kirki-ecommerce'); ?>
                </span>
            </div>

            <!-- Success Alert -->
            <div class="kecom-alert kecom-alert-success" x-show="submitted && successMessage" x-cloak>
                <span x-text="successMessage"></span>
            </div>

            <!-- Error Alert -->
            <div class="kecom-alert kecom-alert-error" x-show="errorMessage" x-cloak>
                <span x-text="errorMessage"></span>
            </div>

            <template x-if="!submitted">
                <form @submit.prevent="submitReview()" class="kecom-review-form">
                    <!-- Rating Selector -->
                    <div class="kecom-field">
                        <label class="kecom-field-label">
                            <?php esc_html_e('Your Rating', 'kirki-ecommerce'); ?> <span class="kecom-required">*</span>
                        </label>
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
                        <label class="kecom-field-label" for="review-content">
                            <?php esc_html_e('Review', 'kirki-ecommerce'); ?> <span class="kecom-required">*</span>
                        </label>
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

                    <!-- Author Details (pre-filled from account) -->
                    <div class="kecom-form-row">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="review-author-name">
                                <?php esc_html_e('Name', 'kirki-ecommerce'); ?> <span class="kecom-required">*</span>
                            </label>
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
                            <label class="kecom-field-label" for="review-author-email">
                                <?php esc_html_e('Email', 'kirki-ecommerce'); ?> <span class="kecom-required">*</span>
                            </label>
                            <input
                                type="email"
                                id="review-author-email"
                                class="kecom-input kecom-input-readonly"
                                x-model="author_email"
                                required
                                readonly
                                title="<?php esc_attr_e('Email is locked to your verified account', 'kirki-ecommerce'); ?>"
                            />
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="kecom-review-submit-row">
                        <button
                            type="submit"
                            class="kecom-btn kecom-btn-primary"
                            :disabled="loading"
                            :class="{ 'kecom-btn-loading': loading }"
                        >
                            <span x-show="!loading" x-text="isEditing ? '<?php echo esc_js(__('Update Review', 'kirki-ecommerce')); ?>' : '<?php echo esc_js(__('Submit Review', 'kirki-ecommerce')); ?>'"></span>
                            <span x-show="loading" x-cloak><?php esc_html_e('Submitting...', 'kirki-ecommerce'); ?></span>
                        </button>
                    </div>
                </form>
            </template>
        </div>
    <?php endif; ?>

    <!-- Filter and Sort Toolbar (only when reviews exist) -->
    <template x-if="allReviews && allReviews.length > 0">
        <div class="kecom-reviews-toolbar">
            <div class="kecom-rating-filter-chips">
                <button
                    type="button"
                    class="kecom-chip"
                    :class="{ 'active': filterRating === 'all' }"
                    @click="filterRating = 'all'"
                >
                    <?php esc_html_e('All', 'kirki-ecommerce'); ?> (<span x-text="allReviews.length"></span>)
                </button>
                <template x-for="star in [5, 4, 3, 2, 1]" :key="star">
                    <button
                        type="button"
                        class="kecom-chip"
                        :class="{ 'active': filterRating == star }"
                        @click="filterRating = star"
                        x-show="ratingBreakdown[star] > 0"
                    >
                        <span x-text="star + ' ★'"></span>
                        <span x-text="'(' + (ratingBreakdown[star] || 0) + ')'"></span>
                    </button>
                </template>
            </div>

            <div class="kecom-sort-selector">
                <label for="kecom-review-sort"><?php esc_html_e('Sort by:', 'kirki-ecommerce'); ?></label>
                <select id="kecom-review-sort" x-model="sortBy">
                    <option value="newest"><?php esc_html_e('Newest First', 'kirki-ecommerce'); ?></option>
                    <option value="highest"><?php esc_html_e('Highest Rating', 'kirki-ecommerce'); ?></option>
                    <option value="lowest"><?php esc_html_e('Lowest Rating', 'kirki-ecommerce'); ?></option>
                    <option value="helpful"><?php esc_html_e('Most Helpful', 'kirki-ecommerce'); ?></option>
                </select>
            </div>
        </div>
    </template>

    <!-- Reviews List with Alpine Data Binding -->
    <template x-if="visibleReviews && visibleReviews.length > 0">
        <div class="kecom-reviews-list">
            <template x-for="rev in visibleReviews" :key="rev.id">
                <div class="kecom-review-card">
                    <div class="kecom-review-meta">
                        <div class="kecom-author-info">
                            <div class="kecom-author-avatar" x-text="rev.author_name ? rev.author_name.charAt(0).toUpperCase() : 'U'"></div>
                            <div>
                                <span class="kecom-author-name" x-text="rev.author_name"></span>
                                <template x-if="rev.is_verified_purchase">
                                    <span class="kecom-verified-badge">
                                        ✓ <?php esc_html_e('Verified Buyer', 'kirki-ecommerce'); ?>
                                    </span>
                                </template>
                            </div>
                        </div>
                        <span class="kecom-review-date" x-text="rev.created_at || ''"></span>
                    </div>

                    <div class="kecom-review-stars">
                        <template x-for="i in 5" :key="i">
                            <span :class="i <= rev.rating ? 'star-filled' : 'star-empty'" x-text="i <= rev.rating ? '★' : '☆'"></span>
                        </template>
                    </div>

                    <template x-if="rev.title">
                        <h4 class="kecom-review-title" x-text="rev.title"></h4>
                    </template>

                    <p class="kecom-review-content" x-text="rev.content"></p>

                    <!-- Store Owner Admin Reply -->
                    <template x-if="rev.admin_reply">
                        <div class="kecom-admin-reply-card">
                            <div class="kecom-admin-reply-header">
                                <span class="kecom-admin-badge">
                                    💬 <?php esc_html_e('Store Owner Response', 'kirki-ecommerce'); ?>
                                </span>
                                <span class="kecom-admin-date" x-text="rev.admin_replied_at || ''"></span>
                            </div>
                            <p class="kecom-admin-reply-content" x-text="rev.admin_reply"></p>
                        </div>
                    </template>

                    <!-- Helpful Upvote Button -->
                    <div class="kecom-review-footer">
                        <button
                            type="button"
                            class="kecom-helpful-btn"
                            @click="voteHelpful(rev.id)"
                            :disabled="votedIds.includes(rev.id)"
                        >
                            <span>👍</span>
                            <span><?php esc_html_e('Helpful', 'kirki-ecommerce'); ?></span>
                            <span x-text="'(' + (rev.helpful_count || 0) + ')'"></span>
                        </button>
                    </div>
                </div>
            </template>
        </div>
    </template>

    <!-- Load More Reviews Button -->
    <template x-if="filteredReviews && filteredReviews.length > visibleCount">
        <div class="kecom-load-more-wrapper">
            <button
                type="button"
                class="kecom-btn kecom-btn-outline"
                @click="visibleCount += 5"
            >
                <?php esc_html_e('Load More Reviews', 'kirki-ecommerce'); ?>
                (<span x-text="filteredReviews.length - visibleCount"></span> <?php esc_html_e('remaining', 'kirki-ecommerce'); ?>)
            </button>
        </div>
    </template>

    <!-- Empty State for Filter or No Reviews -->
    <div class="kecom-reviews-empty" x-show="!submitted && (!allReviews || allReviews.length === 0)">
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
</div>
