<?php

/**
 * Account - My Reviews Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.1
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$paginator = view_data('reviews');
$reviews = $paginator ? $paginator->items() : [];
$total_count = $paginator ? $paginator->total() : count($reviews);
$has_more_pages = $paginator ? $paginator->has_more_pages() : false;
?>

<?php Template::get_header(); ?>
<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar'); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountReviews()">
                <div class="kecom-account-reviews">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title">
                            <?php esc_html_e('My Reviews', 'kirki-ecommerce'); ?>
                            <span class="kecom-count">(<?php echo esc_html($total_count); ?>)</span>
                        </h3>
                    </div>

                    <?php if (empty($reviews) || count($reviews) === 0) : ?>
                        <div class="kecom-account-empty">
                            <div class="kecom-empty-icon">★</div>
                            <h4><?php esc_html_e('No reviews submitted yet', 'kirki-ecommerce'); ?></h4>
                            <p>
                                <?php esc_html_e('When you purchase and receive products, you can share your feedback and see your reviews here.', 'kirki-ecommerce'); ?>
                            </p>
                            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
                                <?php esc_html_e('Browse Shop', 'kirki-ecommerce'); ?>
                            </a>
                        </div>
                    <?php else : ?>
                        <div class="kecom-account-reviews-list">
                            <?php foreach ($reviews as $rev) :
                                $product = $rev->product;
                                $product_url = $product ? Url::get_product_url($product->slug) : '#';
                                $product_title = $product ? $product->title : sprintf(__('Product #%d', 'kirki-ecommerce'), $rev->product_id);
                                $rating_val = (int) $rev->rating;
                                $status = $rev->status;
                                $status_label = $status === ReviewStatus::APPROVED ? __('Approved', 'kirki-ecommerce') : ($status === ReviewStatus::TRASH ? __('Trash', 'kirki-ecommerce') : __('Pending Approval', 'kirki-ecommerce'));
                                $status_badge_class = $status === ReviewStatus::APPROVED ? 'kecom-badge-success' : ($status === ReviewStatus::TRASH ? 'kecom-badge-danger' : 'kecom-badge-warning');
                                ?>
                                <div class="kecom-account-review-card">
                                    <div class="kecom-card-header">
                                        <div>
                                            <a href="<?php echo esc_url($product_url); ?>" class="kecom-product-link">
                                                <?php echo esc_html($product_title); ?> &rarr;
                                            </a>
                                            <div class="kecom-review-meta">
                                                <span class="kecom-stars">
                                                    <?php for ($i = 1; $i <= 5; $i++) echo $i <= $rating_val ? '★' : '☆'; ?>
                                                </span>
                                                <span class="kecom-date">
                                                    <?php echo esc_html($rev->created_at ? (is_string($rev->created_at) ? date('M d, Y', strtotime($rev->created_at)) : $rev->created_at->format('M d, Y')) : ''); ?>
                                                </span>
                                            </div>
                                        </div>
                                        <span class="kecom-badge <?php echo esc_attr($status_badge_class); ?>">
                                            <?php echo esc_html($status_label); ?>
                                        </span>
                                    </div>

                                    <?php if (!empty($rev->title)) : ?>
                                        <h4 class="kecom-review-title">
                                            <?php echo esc_html($rev->title); ?>
                                        </h4>
                                    <?php endif; ?>

                                    <p class="kecom-review-body">
                                        <?php echo nl2br(esc_html($rev->content)); ?>
                                    </p>

                                    <?php if (!empty($rev->admin_reply)) : ?>
                                        <div class="kecom-admin-reply">
                                            <div class="kecom-reply-header">
                                                💬 <?php esc_html_e('Store Owner Response', 'kirki-ecommerce'); ?>
                                                <?php if (!empty($rev->admin_replied_at)) : ?>
                                                    <span class="kecom-reply-date">
                                                        <?php echo esc_html(is_string($rev->admin_replied_at) ? date('M d, Y', strtotime($rev->admin_replied_at)) : $rev->admin_replied_at->format('M d, Y')); ?>
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            <p class="kecom-reply-body">
                                                <?php echo nl2br(esc_html($rev->admin_reply)); ?>
                                            </p>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>

                        <?php if ($has_more_pages) : ?>
                            <div class="kecom-flex kecom-justify-center kecom-mt-6">
                                <button
                                    type="button"
                                    class="kecom-btn kecom-btn-outline"
                                    :class="{ 'kecom-btn-loading': isLoading }"
                                    :disabled="isLoading"
                                    x-show="hasMorePages"
                                    @click="fetchReviews()"
                                >
                                    <?php esc_html_e('Load More', 'kirki-ecommerce'); ?>
                                </button>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </main>
        </div>
    </div>
</div>
<?php Template::get_footer(); ?>
