<?php

/**
 * Order Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 * 
 * @var array $data
 */

defined('ABSPATH') || exit;
extract($data);

$pricing = $cart['pricing'] ?? [];
$formatted_subtotal = $pricing['display_subtotal_money_object']->display ?? '';
$formatted_shipping = $pricing['display_shipping_subtotal_money_object']->display ?? '';
$formatted_tax = $pricing['display_tax_total_money_object']->display ?? '';
$formatted_discount = $pricing['display_discount_total_money_object']->display ?? '';
$formatted_total = $pricing['display_total_money_object']->display ?? '';
?>

<hr />

<!-- Order Summary -->
<div class="kecom-order-summary">
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData ? cartData.pricing?.display_subtotal_money_object?.display : '<?php echo esc_js($formatted_subtotal); ?>'"><?php echo esc_html($formatted_subtotal); ?></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData ? cartData.pricing?.display_shipping_subtotal_money_object?.display : '<?php echo esc_js($formatted_shipping); ?>'"><?php echo esc_html($formatted_shipping); ?></span>
    </div>
    <div class="kecom-summary-row" x-show="discount !== null">
        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="'-' + discount">-<?php echo esc_html($formatted_discount); ?></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Taxes', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData ? cartData.pricing?.display_tax_total_money_object?.display : '<?php echo esc_js($formatted_tax); ?>'"><?php echo esc_html($formatted_tax); ?></span>
    </div>
    <div class="kecom-summary-row kecom-total-row">
        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value kecom-total-value" x-text="cartData ? cartData.pricing?.display_total_money_object?.display : '<?php echo esc_js($formatted_total); ?>'"><?php echo esc_html($formatted_total); ?></span>
    </div>
</div>