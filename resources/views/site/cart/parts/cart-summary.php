<?php

/**
 * Cart Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

$checkout_url = Url::get_checkout_url();
?>

<div class="kecom-cart-summary">
    <h4 class="kecom-cart-summary-title"><?php esc_html_e('Cart Totals', 'kirki-ecommerce'); ?></h4>
    <div class="kecom-cart-summary-item">
        <span class="kecom-cart-summary-item-title"><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-item-value" x-text="cartData.pricing.display_subtotal_money_object.display"></span>
    </div>
    <div class="kecom-cart-summary-total">
        <span class="kecom-cart-summary-total-title"><?php esc_html_e('Estimate Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-total-value" x-text="cartData.pricing.display_subtotal_money_object.display"></span>
    </div>
    <a
        href="<?php echo esc_url($checkout_url); ?>"
        class="kecom-btn kecom-btn-primary kecom-btn-block"
        :class="{ 'kecom-btn-disabled': !cartData.items_count }"
        :aria-disabled="!cartData.items_count"
    >
        <?php esc_html_e('Proceed to Checkout', 'kirki-ecommerce'); ?>
    </a>
</div>