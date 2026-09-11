<?php
/**
 * Shipping Methods Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Icon;

defined('ABSPATH') || exit;
?>

<!-- Shipping Methods -->
<div class="kecom-shipping-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Method', 'kirki-ecommerce'); ?></h2>
    <div class="kecom-shipping-methods" x-show="availableShippingMethods.length > 0">
        <template x-for="shipping in availableShippingMethods" :key="shipping.id">
            <label class="kecom-radio kecom-shipping-option">
                <input class="kecom-radio-input"
                        type="radio"
                        name="shipping_method"
                        :value="shipping.id"
                        x-model="selectedShippingMethod"
                        @change="setShippingMethod(shipping.id)">
                <div class="kecom-radio-label">
                    <span class="kecom-shipping-name" x-text="shipping.name"></span>
                    <span class="kecom-shipping-description" x-text="shipping.description"></span>
                </div>
                <div class="kecom-shipping-price" x-text="shipping?.display_cost_money_object?.display"></div>
            </label>
        </template>
    </div>
    <div x-show="availableShippingMethods.length === 0" class="kecom-text-base kecom-text-subdued">
        <?php esc_html_e('No shipping methods found!', 'kirki-ecommerce'); ?>
    </div>
    <div x-show="shippingMethodError" x-cloak class="kecom-alert kecom-alert-error kecom-mt-4">
        <?php Icon::render('information', ['size' => 20]); ?>
        <p x-text="shippingMethodError"></p>
    </div>
</div>
