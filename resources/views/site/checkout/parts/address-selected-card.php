<?php

/**
 * Checkout - Selected Address Card Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\view_data;

$purpose = $data['purpose'] ?? view_data('purpose', 'shipping');
$is_billing = $purpose === 'billing';
$default_title = $is_billing ? __('Billing Address', 'kirki-ecommerce') : __('Shipping Address', 'kirki-ecommerce');
$title = $data['title'] ?? view_data('title', $default_title);
$address_expression = $is_billing ? 'selectedBillingAddress' : 'selectedShippingAddress';
$open_picker_function = $is_billing ? 'openBillingPicker' : 'openShippingPicker';
?>

<div class="kecom-checkout-address-block">
    <h2 class="kecom-section-title"><?php echo esc_html($title); ?></h2>
    <div class="kecom-checkout-address-card">
        <div class="kecom-checkout-address-card-content" x-show="<?php echo esc_attr($address_expression); ?>">
            <div class="kecom-checkout-address-card-line" x-text="getFormattedAddressFirstLine(<?php echo esc_attr($address_expression); ?>)"></div>
            <div class="kecom-checkout-address-card-line" x-text="getFormattedAddressSecondLine(<?php echo esc_attr($address_expression); ?>)"></div>
        </div>
        <button type="button" class="kecom-btn kecom-btn-link kecom-btn-sm" @click.prevent="<?php echo esc_attr($open_picker_function); ?>">
            <?php esc_html_e('Change', 'kirki-ecommerce'); ?>
        </button>
    </div>
</div>
