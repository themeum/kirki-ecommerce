<?php

/**
 * Order Success Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\view_data;

defined('ABSPATH') || exit;

$order = view_data('order') ?: null;
?>

<?php Template::get_header(); ?>

<div class="kecom-order-success-page">
    <div class="kecom-order-success-card">
        <div class="kecom-order-success-hero">
            <div class="kecom-order-success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none">
                    <rect width="80" height="80" fill="#e3ffed" rx="40"/>
                    <path fill="#6ad972" d="M62.75 40c0 2.737-3.898 4.802-4.961 7.37-1.024 2.476.31 6.704-1.702 8.717-2.013 2.012-6.241.678-8.717 1.702-2.557 1.063-4.636 4.961-7.37 4.961s-4.812-3.898-7.37-4.961c-2.476-1.024-6.704.31-8.717-1.702-2.012-2.013-.678-6.241-1.702-8.717-1.063-2.557-4.961-4.636-4.961-7.37s3.898-4.812 4.961-7.37c1.024-2.474-.31-6.704 1.702-8.717 2.013-2.012 6.243-.678 8.717-1.702 2.568-1.063 4.636-4.961 7.37-4.961s4.813 3.898 7.37 4.961c2.476 1.024 6.704-.31 8.717 1.702 2.012 2.013.678 6.241 1.702 8.717 1.063 2.568 4.961 4.636 4.961 7.37"/>
                    <path fill="#1c7330" d="M50.368 34.08a1.75 1.75 0 0 0-2.856-.568L36.5 44.526l-4.012-4.014a1.75 1.75 0 1 0-2.476 2.477l5.25 5.25a1.75 1.75 0 0 0 2.476 0l12.25-12.25a1.75 1.75 0 0 0 .38-1.909"/>
                </svg>
            </div>
            <h3 class="kecom-order-success-title"><?php _e('Payment Successful', 'kirki-ecommerce'); ?></h3>
            <p class="kecom-order-success-subtitle"><?php _e('Your order has been confirmed and is being processed.', 'kirki-ecommerce'); ?></p>
        </div>

        <?php if ($order): ?>

        <div class="kecom-order-success-section">
            <div class="kecom-order-success-section-label"><?php _e('Payment Details', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-rows">
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Invoice Number', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value"><?php echo esc_html($order['order_number']); ?></div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Order Time', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value">
                        <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $order['created_at']->get_timestamp())); ?>
                    </div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Payment Method', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value"><?php echo esc_html(ucfirst($order['payment_method'])); ?></div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Payment Status', 'kirki-ecommerce'); ?></div>
                    <span class="kecom-badge kecom-badge-<?php echo esc_attr($order['payment_status'] === 'paid' ? 'success-light' : 'warning'); ?>">
                        <?php echo esc_html(ucfirst($order['payment_status'])); ?>
                    </span>
                </div>
            </div>
        </div>

        <div class="kecom-order-success-section">
            <div class="kecom-order-success-section-label"><?php _e('Product Details', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-rows">
                <?php foreach ($order['items']->all() as $item): ?>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key">
                        <?php echo esc_html($item['product_name']); ?>
                        <?php if (!empty($item['variant_name'])): ?>• <?php echo esc_html($item['variant_name']); ?><?php endif; ?>
                        x<?php echo esc_html($item['quantity']); ?>
                    </div>
                    <div class="kecom-order-success-row-value"><?php echo esc_html($item['total']->display); ?></div>
                </div>
                <?php endforeach; ?>

                <?php if ($order['totals']['shipping']->raw > 0): ?>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Shipping', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value"><?php echo esc_html($order['totals']['shipping']->display); ?></div>
                </div>
                <?php endif; ?>

                <?php if ($order['totals']['discount']->raw > 0): ?>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Discount', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value kecom-order-success-row-value--discount">
                        -<?php echo esc_html($order['totals']['discount']->display); ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="kecom-order-success-total">
            <div class="kecom-order-success-total-label"><?php _e('Total Amount', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-total-value"><?php echo esc_html($order['totals']['total']->display); ?></div>
        </div>

        <?php endif; ?>

        <div class="kecom-order-success-actions">
            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-btn-block">
                <?php _e('Continue Shopping', 'kirki-ecommerce'); ?>
            </a>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
