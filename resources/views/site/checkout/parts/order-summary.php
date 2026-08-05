<?php
/**
 * Order Summary Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);

use Kirki\Ecommerce\App\Facades\Money;

$pricing = $cart['pricing'] ?? [];
$formatted_subtotal = Money::format_from_decimal($pricing['subtotal'] ?? 0);
$formatted_shipping = Money::format_from_decimal($pricing['shipping_total'] ?? 0);
$formatted_discount = Money::format_from_decimal($pricing['discount_total'] ?? 0);
$formatted_total = Money::format_from_decimal($pricing['total'] ?? 0);
?>

<hr />

<!-- Order Summary -->
<div class="kecom-order-summary">
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData ? cartData.pricing.subtotal_formatted : '<?php echo esc_js($formatted_subtotal); ?>'"><?php echo esc_html($formatted_subtotal); ?></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData ? currency + parseFloat(cartData.pricing.shipping_total).toFixed(2) : '<?php echo esc_js($formatted_shipping); ?>'"><?php echo esc_html($formatted_shipping); ?></span>
    </div>
    <div class="kecom-summary-row" x-show="discount > 0">
        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="'-' + currency + discount.toFixed(2)">-<?php echo esc_html($formatted_discount); ?></span>
    </div>
    <div class="kecom-summary-row kecom-total-row">
        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value kecom-total-value" x-text="cartData ? cartData.pricing.total_formatted : '<?php echo esc_js($formatted_total); ?>'"><?php echo esc_html($formatted_total); ?></span>
    </div>
</div>
