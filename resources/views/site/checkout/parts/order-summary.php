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
    <div class="kecom-summary-row kecom-discount-row" x-show="discount !== null">
        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="'-' + discount"></span>
    </div>
    <div class="kecom-summary-row" x-show="discount !== null">
        <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value" x-text="cartData.pricing?.display_order_total_money_object?.display"></span>
    </div>
    <div class="kecom-summary-row">
        <span><?php esc_html_e('Shipping', 'kirki-ecommerce'); ?></span>
        <span class="kecom-summary-value">
            <span x-text="cartData.pricing?.display_shipping_amount_money_object?.display"></span>
            <span class="kecom-summary-discount"
                x-show="Boolean(cartData.pricing?.display_shipping_strikethrough_money_object?.raw > cartData.pricing?.display_shipping_amount_money_object?.raw)"
                x-text="cartData.pricing?.display_shipping_strikethrough_money_object?.display"
                x-cloak></span>
        </span>
    </div>
    <template x-for="tax_line in (!isTaxInclusivePrice ? cartData.pricing?.tax_lines || [] : [])">
        <div class="kecom-summary-row">
            <span x-text="tax_line.name"></span>
            <span class="kecom-summary-value" x-text="tax_line.display_amount_money_object?.display"></span>
        </div>
    </template>
    <div class="kecom-summary-row kecom-total-row">
        <div class="kecom-total-label-wrapper">
            <span><?php esc_html_e('Total Amount', 'kirki-ecommerce'); ?></span>
            <div class="kecom-inclusive-tax-wrapper" x-show="isTaxInclusivePrice && Boolean(cartData.pricing?.display_tax_total_money_object?.raw)" x-cloak>
                <span class="kecom-inclusive-tax-summary" x-text="inclusiveTaxSummary"></span>
                <div class="kecom-inclusive-tax-lines" x-show="(cartData.pricing?.tax_lines || []).length > 1">
                    <template x-for="tax_line in (cartData.pricing?.tax_lines || [])" :key="tax_line.name + '|' + tax_line.rate">
                        <div class="kecom-inclusive-tax-line" x-text="formatTaxLine(tax_line)"></div>
                    </template>
                </div>
            </div>
        </div>
        <div class="kecom-summary-value kecom-total-value">
            <span class="kecom-total-currency" x-text="cartData.pricing?.display_total_money_object?.currency?.code"></span>
            <span x-text="cartData.pricing?.display_total_money_object?.display"></span>
        </div>
    </div>
</div>