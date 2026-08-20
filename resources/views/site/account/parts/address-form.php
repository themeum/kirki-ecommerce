<?php

/**
 * Account - Address Edit Form Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;
?>

<div class="kecom-card" x-show="editingAddress" x-cloak>
    <div class="kecom-card-header">
        <h3 class="kecom-card-title" x-text="editingAddress === 'billing' ? '<?php esc_attr_e('Edit Billing Address', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('Edit Shipping Address', 'kirki-ecommerce'); ?>'"></h3>
    </div>

    <form @submit.prevent="saveAddress" class="kecom-form">
        <template x-if="errorMessage">
            <div class="kecom-alert kecom-alert-error" x-text="errorMessage"></div>
        </template>

        <div class="kecom-form-row">
            <div class="kecom-field">
                <label for="address_first_name" class="kecom-field-label"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_first_name"
                    name="first_name"
                    class="kecom-input"
                    x-model="formData.first_name"
                />
            </div>

            <div class="kecom-field">
                <label for="address_last_name" class="kecom-field-label"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_last_name"
                    name="last_name"
                    class="kecom-input"
                    x-model="formData.last_name"
                />
            </div>
        </div>

        <div class="kecom-field">
            <label for="address_company" class="kecom-field-label"><?php esc_html_e('Company name', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_company"
                name="company"
                class="kecom-input"
                x-model="formData.company"
            />
        </div>

        <div class="kecom-field">
            <label for="address_country" class="kecom-field-label"><?php esc_html_e('Country / Region', 'kirki-ecommerce'); ?></label>
            <select
                id="address_country"
                name="country"
                class="kecom-select"
                x-model="formData.country"
                @change="formData.state = ''"
            >
                <option value=""><?php esc_html_e('Select country', 'kirki-ecommerce'); ?></option>
                <template x-for="country in countries" :key="country.code || country.id">
                    <option :value="country.code || country.id" x-text="country.name"></option>
                </template>
            </select>
        </div>

        <div class="kecom-field">
            <label for="address_line1" class="kecom-field-label"><?php esc_html_e('Street address', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_line1"
                name="address_line1"
                class="kecom-input"
                placeholder="<?php esc_attr_e('House number and street name', 'kirki-ecommerce'); ?>"
                x-model="formData.address_line1"
            />
        </div>

        <div class="kecom-field">
            <label for="address_line2" class="kecom-field-label"><?php esc_html_e('Apartment, suite, unit, etc.', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_line2"
                name="address_line2"
                class="kecom-input"
                x-model="formData.address_line2"
            />
        </div>

        <div class="kecom-form-row">
            <div class="kecom-field">
                <label for="address_city" class="kecom-field-label"><?php esc_html_e('Town / City', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_city"
                    name="city"
                    class="kecom-input"
                    x-model="formData.city"
                />
            </div>

            <div class="kecom-field">
                <label for="address_state" class="kecom-field-label"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                <select
                    id="address_state"
                    name="state"
                    class="kecom-select"
                    x-model="formData.state"
                >
                    <option value=""><?php esc_html_e('Select State', 'kirki-ecommerce'); ?></option>
                    <template x-for="state in availableStates" :key="state.id">
                        <option :value="state.id" x-text="state.name"></option>
                    </template>
                </select>
            </div>

            <div class="kecom-field">
                <label for="address_postal_code" class="kecom-field-label"><?php esc_html_e('Postcode / ZIP', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_postal_code"
                    name="postal_code"
                    class="kecom-input"
                    x-model="formData.postal_code"
                />
            </div>
        </div>

        <div class="kecom-field">
            <label for="address_phone" class="kecom-field-label"><?php esc_html_e('Phone', 'kirki-ecommerce'); ?></label>
            <input
                type="tel"
                id="address_phone"
                name="phone"
                class="kecom-input"
                x-model="formData.phone"
            />
        </div>

        <div class="kecom-card-footer" style="gap: 12px;">
            <button type="submit" class="kecom-btn kecom-btn-primary" :class="{ 'kecom-btn-loading': loading }" :disabled="loading">
                <?php esc_html_e('Save Address', 'kirki-ecommerce'); ?>
            </button>
            <button type="button" class="kecom-btn kecom-btn-outline" :disabled="loading" @click.prevent="cancelEdit">
                <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
            </button>
        </div>
    </form>
</div>
