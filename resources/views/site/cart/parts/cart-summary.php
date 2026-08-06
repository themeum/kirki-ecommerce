<?php

/**
 * Cart Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\include_view;


$summary_items = [
    ['title' => __('Subtotal', 'kirki-ecommerce'), 'text' => 'cartData.pricing.subtotal_formatted'],
    ['title' => __('Estimate Shipping', 'kirki-ecommerce'), 'text' => ''],
    ['title' => __('Estimate Taxes', 'kirki-ecommerce'), 'text' => '']
];
?>

<div class="kecom-cart-summary">
    <h4 class="kecom-cart-summary-title"><?php _e('Cart Totals', 'kirki-ecommerce'); ?></h4>
    <?php foreach ($summary_items as $item): ?>
        <?php include_view('site.cart.parts.cart-summary-item', $item); ?>
    <?php endforeach; ?>
    <div class="kecom-cart-summary-total">
        <span class="kecom-cart-summary-total-title"><?php _e('Estimate Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-cart-summary-total-value" x-text="cartData.pricing.total_formatted"></span>
    </div>
    <a href="<?php echo esc_url(Url::get_checkout_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-cart-summary-checkout-btn">
        <?php _e('Proceed to Checkout', 'kirki-ecommerce'); ?>
    </a>
</div>