<?php

/**
 * Account - My Reviews Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.1
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$reviews = view_data('reviews') ?? [];
?>

<?php Template::get_header(); ?>
<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar'); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-account-panel-header">
                    <h3 class="kecom-account-panel-header-title">
                        <?php esc_html_e('My Reviews', 'kirki-ecommerce'); ?>
                        <span class="kecom-count" style="font-size: 14px; font-weight: normal; color: #64748b;">
                            (<?php echo count($reviews); ?>)
                        </span>
                    </h3>
                </div>

                <?php if (empty($reviews) || count($reviews) === 0) : ?>
                    <div class="kecom-account-empty" style="text-align: center; padding: 48px 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <div style="font-size: 36px; color: #f59e0b; margin-bottom: 12px;">★</div>
                        <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #0f172a;">
                            <?php esc_html_e('No reviews submitted yet', 'kirki-ecommerce'); ?>
                        </h4>
                        <p style="color: #64748b; font-size: 14px; max-width: 420px; margin: 0 auto 20px;">
                            <?php esc_html_e('When you purchase and receive products, you can share your feedback and see your reviews here.', 'kirki-ecommerce'); ?>
                        </p>
                        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
                            <?php esc_html_e('Browse Shop', 'kirki-ecommerce'); ?>
                        </a>
                    </div>
                <?php else : ?>
                    <div class="kecom-account-reviews-list" style="display: flex; flex-direction: column; gap: 16px;">
                        <?php foreach ($reviews as $rev) :
                            $product = $rev->product;
                            $product_url = $product ? Url::get_product_url($product->slug) : '#';
                            $product_title = $product ? $product->title : sprintf(__('Product #%d', 'kirki-ecommerce'), $rev->product_id);
                            $rating_val = (int) $rev->rating;
                            $status = $rev->status;
                            $status_label = $status === 'approved' ? __('Approved', 'kirki-ecommerce') : ($status === 'rejected' ? __('Rejected', 'kirki-ecommerce') : __('Pending Approval', 'kirki-ecommerce'));
                            $status_bg = $status === 'approved' ? '#ecfdf5' : ($status === 'rejected' ? '#fef2f2' : '#fffbeb');
                            $status_color = $status === 'approved' ? '#065f46' : ($status === 'rejected' ? '#991b1b' : '#92400e');
                            ?>
                            <div class="kecom-account-review-card" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                                    <div>
                                        <a href="<?php echo esc_url($product_url); ?>" style="font-size: 16px; font-weight: 600; color: #0f172a; text-decoration: none;">
                                            <?php echo esc_html($product_title); ?> &rarr;
                                        </a>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                            <span style="color: #f59e0b; font-size: 14px; letter-spacing: 2px;">
                                                <?php for ($i = 1; $i <= 5; $i++) echo $i <= $rating_val ? '★' : '☆'; ?>
                                            </span>
                                            <span style="font-size: 13px; color: #64748b;">
                                                <?php echo $rev->created_at ? (is_string($rev->created_at) ? date('M d, Y', strtotime($rev->created_at)) : $rev->created_at->format('M d, Y')) : ''; ?>
                                            </span>
                                        </div>
                                    </div>
                                    <span style="display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: <?php echo esc_attr($status_bg); ?>; color: <?php echo esc_attr($status_color); ?>;">
                                        <?php echo esc_html($status_label); ?>
                                    </span>
                                </div>

                                <?php if (!empty($rev->title)) : ?>
                                    <h4 style="font-size: 15px; font-weight: 600; margin: 0; color: #1e293b;">
                                        <?php echo esc_html($rev->title); ?>
                                    </h4>
                                <?php endif; ?>

                                <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.6;">
                                    <?php echo nl2br(esc_html($rev->content)); ?>
                                </p>

                                <?php if (!empty($rev->admin_reply)) : ?>
                                    <div style="margin-top: 8px; padding: 12px 16px; background-color: #f8fafc; border-left: 3px solid #2563eb; border-radius: 0 8px 8px 0;">
                                        <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-bottom: 4px;">
                                            💬 <?php esc_html_e('Store Owner Response', 'kirki-ecommerce'); ?>
                                            <?php if (!empty($rev->admin_replied_at)) : ?>
                                                <span style="color: #64748b; font-weight: normal; margin-left: 6px;">
                                                    <?php echo is_string($rev->admin_replied_at) ? date('M d, Y', strtotime($rev->admin_replied_at)) : $rev->admin_replied_at->format('M d, Y'); ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                        <p style="font-size: 13px; color: #334155; margin: 0; line-height: 1.5;">
                                            <?php echo esc_html($rev->admin_reply); ?>
                                        </p>
                                    </div>
                                <?php endif; ?>

                                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                                    <a href="<?php echo esc_url($product_url . '#reviews'); ?>" class="kecom-btn kecom-btn-sm kecom-btn-outline">
                                        <?php esc_html_e('View or Edit on Product Page', 'kirki-ecommerce'); ?> &rarr;
                                    </a>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </main>
        </div>
    </div>
</div>
<?php Template::get_footer(); ?>
