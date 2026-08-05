<?php
/**
 * Shipping Methods Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Shipping Methods -->
<div class="kecom-shipping-section" x-data="{ availableShippingMethods: [], selectedShippingMethod: '' }" x-init="
    // Listen for shipping methods updated event
    window.addEventListener('shipping-methods-updated', (e) => {
        availableShippingMethods = e.detail.shippingMethods;
        if (e.detail.selectedMethod) {
            selectedShippingMethod = e.detail.selectedMethod;
        }
    });

    // Listen for initial data
    window.dispatchEvent(new CustomEvent('get-shipping-methods'));
">
    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Method', 'kirki-ecommerce'); ?></h2>
    <div class="kecom-shipping-methods" x-show="availableShippingMethods.length > 0">
        <template x-for="shipping in availableShippingMethods" :key="shipping.id">
            <label class="kecom-radio kecom-shipping-option">
                <input class="kecom-radio-input"
                        type="radio"
                        name="shipping_method"
                        :value="shipping.id"
                        x-model="selectedShippingMethod"
                        @change="window.dispatchEvent(new CustomEvent('set-shipping-method', { detail: { methodId: shipping.id } }))">
                <div class="kecom-radio-label">
                    <span class="kecom-shipping-name" x-text="shipping.name"></span>
                </div>
                <div class="kecom-shipping-price" x-text="shipping.cost"></div>
            </label>
        </template>
    </div>
    <div x-show="availableShippingMethods.length === 0" class="kecom-text-subdued">
        <?php esc_html_e('Please select your shipping address to see available shipping methods.', 'kirki-ecommerce'); ?>
    </div>
</div>
