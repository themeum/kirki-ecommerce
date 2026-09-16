<?php

/**
 * Order Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 *
 * @var array $data
 */

defined('ABSPATH') || exit;
?>

<hr />

<!-- Order Summary -->
<div class="kecom-order-summary">
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData.pricing?.display_items_subtotal_money_object?.display"></span>
    </div>
    <div class="kecom-summary-row" x-show="discount !== null">
        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="'-' + discount"></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData.pricing?.display_order_total_money_object?.display"></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData.pricing?.display_shipping_amount_money_object?.display"></span>
    </div>
    <template x-for="tax_line in cartData.pricing.tax_lines">
        <div class="kecom-summary-row">
            <span x-text="tax_line.name"></span>
            <span class="kecom-summary-value" x-text="tax_line.display_amount_money_object?.display"></span>
        </div>
    </template>
    <div class="kecom-summary-row kecom-total-row">
        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value kecom-total-value" x-text="cartData.pricing?.display_total_money_object?.display"></span>
    </div>
</div>