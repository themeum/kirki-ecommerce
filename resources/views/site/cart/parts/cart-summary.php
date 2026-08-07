<?php

/**
 * Cart Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\user;

$checkout_url = Url::get_checkout_url();
$login_url = Url::get_login_url($checkout_url);
$url = user()->is_logged_in() ? $checkout_url : $login_url;
?>

<div class="kecom-cart-summary">
    <h4 class="kecom-cart-summary-title"><?php _e('Cart Totals', 'kirki-ecommerce'); ?></h4>
    <div class="kecom-cart-summary-item">
        <span class="kecom-cart-summary-item-title"><?php _e('Subtotal', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-item-value" x-text="cartData.pricing.subtotal_formatted"></span>
    </div>
    <div class="kecom-cart-summary-item">
        <span class="kecom-cart-summary-item-title"><?php _e('Estimate shipping', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
    </div>
    <div class="kecom-cart-summary-item">
        <span class="kecom-cart-summary-item-title"><?php _e('Estimate taxes', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-item-value"><?php echo '-' ?></span>
    </div>
    <div class="kecom-cart-summary-total">
        <span class="kecom-cart-summary-total-title"><?php _e('Estimate Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-total-value" x-text="cartData.pricing.total_formatted"></span>
    </div>
    <a href="<?php echo esc_url($url); ?>" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-cart-summary-checkout-btn">
        <?php _e('Proceed to Checkout', 'kirki-ecommerce'); ?>
    </a>
</div>