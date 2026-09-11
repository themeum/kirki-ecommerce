<?php

/**
 * Shipping Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use function Kirki\Ecommerce\Framework\include_view;

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Shipping Section: Saved Address Card -->
<div x-show="hasSavedAddresses" class="kecom-checkout-saved-address-wrap">
    <?php include_view('site.checkout.parts.address-selected-card', [
        'purpose' => 'shipping',
        'title'   => __('Shipping Address', 'kirki-ecommerce'),
    ]); ?>
    <div class="kecom-field kecom-checkout-billing-toggle">
        <label class="kecom-checkbox">
            <input class="kecom-checkbox-input" type="checkbox" x-model="billingSameAsShipping">
            <span class="kecom-checkbox-label"><?php esc_html_e('The billing address is same as shipping address.', 'kirki-ecommerce'); ?></span>
        </label>
    </div>
</div>

<!-- Shipping Section: Inline Form (when no saved addresses) -->
<div class="kecom-billing-section" x-show="!hasSavedAddresses">
    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Details', 'kirki-ecommerce'); ?></h2>
    <div id="shipping-form" class="kecom-billing-form kecom-form">
        <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.country }">
            <label class="kecom-field-label" for="shipping-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
            <select class="kecom-select" id="shipping-country" name="country" x-model="shippingAddress.country" @change="onShippingCountryChange">
                <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                <?php foreach ($countries as $country) : ?>
                    <option value="<?php echo esc_attr($country['code']); ?>">
                        <?php echo esc_html($country['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <span class="kecom-field-error" x-show="shippingErrors.country" x-text="shippingErrors.country"></span>
        </div>
        <div class="kecom-billing-form-row">
            <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.first_name }">
                <label class="kecom-field-label" for="shipping-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="shipping-first-name"
                    name="first_name"
                    x-model="shippingAddress.first_name"
                    @input="delete shippingErrors.first_name">
                <span class="kecom-field-error" x-show="shippingErrors.first_name" x-text="shippingErrors.first_name"></span>
            </div>
            <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.last_name }">
                <label class="kecom-field-label" for="shipping-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="shipping-last-name"
                    name="last_name"
                    x-model="shippingAddress.last_name"
                    @input="delete shippingErrors.last_name">
                <span class="kecom-field-error" x-show="shippingErrors.last_name" x-text="shippingErrors.last_name"></span>
            </div>
        </div>
        <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.address_line1 }">
            <label class="kecom-field-label" for="shipping-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
            <input
                class="kecom-input"
                type="text"
                id="shipping-address-line1"
                name="address_line1"
                x-model="shippingAddress.address_line1"
                @input="delete shippingErrors.address_line1">
            <span class="kecom-field-error" x-show="shippingErrors.address_line1" x-text="shippingErrors.address_line1"></span>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="shipping-address-line2">
                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
            </label>
            <input class="kecom-input" type="text" id="shipping-address-line2" name="address_line2" x-model="shippingAddress.address_line2">
        </div>
        <div class="kecom-billing-form-row">
            <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.city }">
                <label class="kecom-field-label" for="shipping-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="shipping-city"
                    name="city"
                    x-model="shippingAddress.city"
                    @input="delete shippingErrors.city">
                <span class="kecom-field-error" x-show="shippingErrors.city" x-text="shippingErrors.city"></span>
            </div>
            <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.state }">
                <label class="kecom-field-label" for="shipping-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                <select
                    class="kecom-select"
                    id="shipping-state"
                    name="state"
                    :disabled="shippingStates.length === 0"
                    x-model="shippingAddress.state"
                    @change="onShippingStateChange">
                    <option value="" x-text="shippingStates.length ? '<?php esc_attr_e('Select State', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('No states available', 'kirki-ecommerce'); ?>'"></option>
                    <template x-for="state in shippingStates" :key="state.id">
                        <option :value="state.id" x-text="state.name" :selected="String(state.id) === String(shippingAddress.state)"></option>
                    </template>
                </select>
                <span class="kecom-field-error" x-show="shippingErrors.state" x-text="shippingErrors.state"></span>
            </div>
            <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.postal_code }">
                <label class="kecom-field-label" for="shipping-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="shipping-postal-code"
                    name="postal_code"
                    x-model="shippingAddress.postal_code"
                    @input="delete shippingErrors.postal_code">
                <span class="kecom-field-error" x-show="shippingErrors.postal_code" x-text="shippingErrors.postal_code"></span>
            </div>
        </div>
        <div class="kecom-field" :class="{ 'kecom-field-error-state': shippingErrors.phone }">
            <label class="kecom-field-label" for="shipping-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
            <input
                class="kecom-input"
                type="tel"
                id="shipping-phone"
                name="phone"
                x-model="shippingAddress.phone"
                @input="delete shippingErrors.phone">
            <span class="kecom-field-error" x-show="shippingErrors.phone" x-text="shippingErrors.phone"></span>
        </div>
        <div class="kecom-field">
            <label class="kecom-checkbox">
                <input class="kecom-checkbox-input" type="checkbox" x-model="billingSameAsShipping">
                <span class="kecom-checkbox-label"><?php esc_html_e('The billing address is same as shipping address.', 'kirki-ecommerce'); ?></span>
            </label>
        </div>
    </div>
</div>
