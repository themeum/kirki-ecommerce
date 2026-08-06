<?php

/**
 * Order Success Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;
?>

<?php Template::get_header(); ?>

<div class="kecom-order-success-page">
    <div class="kecom-order-success-card">
        <div class="kecom-order-success-hero">
            <div class="kecom-order-success-icon">
                <?php Icon::render('receipt', array('size' => 80)); ?>
            </div>
            <h3 class="kecom-order-success-title"><?php _e('Payment Successful', 'kirki-ecommerce'); ?></h3>
            <p class="kecom-order-success-subtitle"><?php _e('Your order has been confirmed and is being processed.', 'kirki-ecommerce'); ?></p>
        </div>
        <div class="kecom-order-success-section">
            <div class="kecom-order-success-section-label"><?php _e('Payment Details', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-rows">
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Invoice Number', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value">S564 F5677 G6412</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Order Time', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value">01:09 AM, 20 June 2025</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Payment Method', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value">PayPal</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Payment Status', 'kirki-ecommerce'); ?></div>
                    <span class="kecom-badge kecom-badge-success-light"><?php _e('Completed', 'kirki-ecommerce'); ?></span>
                </div>
            </div>
        </div>
        <div class="kecom-order-success-section">
            <div class="kecom-order-success-section-label"><?php _e('Product Details', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-rows">
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key">Urban Runner • L • Grey Orange x1</div>
                    <div class="kecom-order-success-row-value">$12.00</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key">Festival Mask x1</div>
                    <div class="kecom-order-success-row-value">$3.00</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key">Cikrate Wristwatch • M • Green Yellow x2</div>
                    <div class="kecom-order-success-row-value">$12.00</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Shipping', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value">$12.99</div>
                </div>
                <div class="kecom-order-success-row">
                    <div class="kecom-order-success-row-key"><?php _e('Discount', 'kirki-ecommerce'); ?></div>
                    <div class="kecom-order-success-row-value kecom-order-success-row-value--discount">-$7.00</div>
                </div>
            </div>
        </div>
        <div class="kecom-order-success-total">
            <div class="kecom-order-success-total-label"><?php _e('Total Amount', 'kirki-ecommerce'); ?></div>
            <div class="kecom-order-success-total-value">$19.99</div>
        </div>
        <div class="kecom-order-success-actions">
            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-btn-block"><?php _e('Continue Shopping', 'kirki-ecommerce'); ?></a>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
