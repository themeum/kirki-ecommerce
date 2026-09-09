<?php
/**
 * Billing Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use function Kirki\Ecommerce\Framework\include_view;

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Billing Section -->
<div class="kecom-billing-section" x-show="!billingSameAsShipping" x-cloak>
    <!-- Saved Address Card -->
    <div x-show="showSavedBillingAddress" class="kecom-checkout-saved-address-wrap">
        <?php include_view('site.checkout.parts.address-selected-card', [
            'purpose' => 'billing',
            'title'   => __('Billing Address', 'kirki-ecommerce'),
        ]); ?>
    </div>

    <!-- Inline Billing Form (when no saved addresses or only 1 address) -->
    <div x-show="!showSavedBillingAddress">
        <h2 class="kecom-section-title"><?php esc_html_e('Billing Details', 'kirki-ecommerce'); ?></h2>
        <div id="billing-form" class="kecom-billing-form kecom-form">
            <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.country }">
                <label class="kecom-field-label" for="billing-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
                <select class="kecom-select" id="billing-country" name="country" x-model="billingAddress.country" @change="onBillingCountryChange">
                    <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                    <?php foreach ($countries as $country) : ?>
                        <option value="<?php echo esc_attr($country['code']); ?>">
                            <?php echo esc_html($country['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <span class="kecom-field-error" x-show="billingErrors.country" x-text="billingErrors.country"></span>
            </div>
            <div class="kecom-billing-form-row">
                <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.first_name }">
                    <label class="kecom-field-label" for="billing-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                    <input
                        class="kecom-input"
                        type="text"
                        id="billing-first-name"
                        name="first_name"
                        x-model="billingAddress.first_name"
                        @input="delete billingErrors.first_name">
                    <span class="kecom-field-error" x-show="billingErrors.first_name" x-text="billingErrors.first_name"></span>
                </div>
                <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.last_name }">
                    <label class="kecom-field-label" for="billing-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                    <input
                        class="kecom-input"
                        type="text"
                        id="billing-last-name"
                        name="last_name"
                        x-model="billingAddress.last_name"
                        @input="delete billingErrors.last_name">
                    <span class="kecom-field-error" x-show="billingErrors.last_name" x-text="billingErrors.last_name"></span>
                </div>
            </div>
            <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.address_line1 }">
                <label class="kecom-field-label" for="billing-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="billing-address-line1"
                    name="address_line1"
                    x-model="billingAddress.address_line1"
                    @input="delete billingErrors.address_line1">
                <span class="kecom-field-error" x-show="billingErrors.address_line1" x-text="billingErrors.address_line1"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-address-line2">
                    <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
                </label>
                <input class="kecom-input" type="text" id="billing-address-line2" name="address_line2" x-model="billingAddress.address_line2">
            </div>
            <div class="kecom-billing-form-row">
                <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.city }">
                    <label class="kecom-field-label" for="billing-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                    <input
                        class="kecom-input"
                        type="text"
                        id="billing-city"
                        name="city"
                        x-model="billingAddress.city"
                        @input="delete billingErrors.city">
                    <span class="kecom-field-error" x-show="billingErrors.city" x-text="billingErrors.city"></span>
                </div>
                <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.state }">
                    <label class="kecom-field-label" for="billing-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                    <select
                        class="kecom-select"
                        id="billing-state"
                        name="state"
                        :disabled="billingStates.length === 0"
                        x-model="billingAddress.state"
                        @change="onBillingStateChange">
                        <option value="" x-text="billingStates.length ? '<?php esc_attr_e('Select State', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('No states available', 'kirki-ecommerce'); ?>'"></option>
                        <template x-for="state in billingStates" :key="state.id">
                            <option :value="state.id" x-text="state.name" :selected="String(state.id) === String(billingAddress.state)"></option>
                        </template>
                    </select>
                    <span class="kecom-field-error" x-show="billingErrors.state" x-text="billingErrors.state"></span>
                </div>
                <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.postal_code }">
                    <label class="kecom-field-label" for="billing-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                    <input
                        class="kecom-input"
                        type="text"
                        id="billing-postal-code"
                        name="postal_code"
                        x-model="billingAddress.postal_code"
                        @input="delete billingErrors.postal_code">
                    <span class="kecom-field-error" x-show="billingErrors.postal_code" x-text="billingErrors.postal_code"></span>
                </div>
            </div>
            <div class="kecom-field" :class="{ 'kecom-field-error-state': billingErrors.phone }">
                <label class="kecom-field-label" for="billing-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="tel"
                    id="billing-phone"
                    name="phone"
                    x-model="billingAddress.phone"
                    @input="delete billingErrors.phone">
                <span class="kecom-field-error" x-show="billingErrors.phone" x-text="billingErrors.phone"></span>
            </div>
        </div>
    </div>
</div>
