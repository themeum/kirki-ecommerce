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
            <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.first_name }">
                <label for="address_first_name" class="kecom-field-label"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_first_name"
                    name="first_name"
                    class="kecom-input"
                    :class="{ 'kecom-input-error': errors.first_name }"
                    x-model="formData.first_name"
                    @input="delete errors.first_name"
                />
                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
            </div>

            <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.last_name }">
                <label for="address_last_name" class="kecom-field-label"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_last_name"
                    name="last_name"
                    class="kecom-input"
                    :class="{ 'kecom-input-error': errors.last_name }"
                    x-model="formData.last_name"
                    @input="delete errors.last_name"
                />
                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
            </div>
        </div>

        <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.company }">
            <label for="address_company" class="kecom-field-label"><?php esc_html_e('Company name', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_company"
                name="company"
                class="kecom-input"
                :class="{ 'kecom-input-error': errors.company }"
                x-model="formData.company"
                @input="delete errors.company"
            />
            <span class="kecom-field-error" x-show="errors.company" x-text="errors.company"></span>
        </div>

        <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.country }">
            <label for="address_country" class="kecom-field-label"><?php esc_html_e('Country / Region', 'kirki-ecommerce'); ?></label>
            <select
                id="address_country"
                name="country"
                class="kecom-select"
                :class="{ 'kecom-input-error': errors.country }"
                x-model="formData.country"
                @change="formData.state = ''; delete errors.country"
            >
                <option value=""><?php esc_html_e('Select country', 'kirki-ecommerce'); ?></option>
                <template x-for="country in countries" :key="country.code || country.id">
                    <option :value="country.code || country.id" x-text="country.name"></option>
                </template>
            </select>
            <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
        </div>

        <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.address_line1 }">
            <label for="address_line1" class="kecom-field-label"><?php esc_html_e('Street address', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_line1"
                name="address_line1"
                class="kecom-input"
                :class="{ 'kecom-input-error': errors.address_line1 }"
                placeholder="<?php esc_attr_e('House number and street name', 'kirki-ecommerce'); ?>"
                x-model="formData.address_line1"
                @input="delete errors.address_line1"
            />
            <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
        </div>

        <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.address_line2 }">
            <label for="address_line2" class="kecom-field-label"><?php esc_html_e('Apartment, suite, unit, etc.', 'kirki-ecommerce'); ?></label>
            <input
                type="text"
                id="address_line2"
                name="address_line2"
                class="kecom-input"
                :class="{ 'kecom-input-error': errors.address_line2 }"
                x-model="formData.address_line2"
                @input="delete errors.address_line2"
            />
            <span class="kecom-field-error" x-show="errors.address_line2" x-text="errors.address_line2"></span>
        </div>

        <div class="kecom-form-row">
            <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.city }">
                <label for="address_city" class="kecom-field-label"><?php esc_html_e('Town / City', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_city"
                    name="city"
                    class="kecom-input"
                    :class="{ 'kecom-input-error': errors.city }"
                    x-model="formData.city"
                    @input="delete errors.city"
                />
                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
            </div>

            <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.state }">
                <label for="address_state" class="kecom-field-label"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                <select
                    id="address_state"
                    name="state"
                    class="kecom-select"
                    :class="{ 'kecom-input-error': errors.state }"
                    x-model="formData.state"
                    @change="delete errors.state"
                >
                    <option value=""><?php esc_html_e('Select State', 'kirki-ecommerce'); ?></option>
                    <template x-for="state in availableStates" :key="state.id">
                        <option :value="state.id" x-text="state.name"></option>
                    </template>
                </select>
                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
            </div>

            <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.postal_code }">
                <label for="address_postal_code" class="kecom-field-label"><?php esc_html_e('Postcode / ZIP', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="address_postal_code"
                    name="postal_code"
                    class="kecom-input"
                    :class="{ 'kecom-input-error': errors.postal_code }"
                    x-model="formData.postal_code"
                    @input="delete errors.postal_code"
                />
                <span class="kecom-field-error" x-show="errors.postal_code" x-text="errors.postal_code"></span>
            </div>
        </div>

        <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.phone }">
            <label for="address_phone" class="kecom-field-label"><?php esc_html_e('Phone', 'kirki-ecommerce'); ?></label>
            <input
                type="tel"
                id="address_phone"
                name="phone"
                class="kecom-input"
                :class="{ 'kecom-input-error': errors.phone }"
                x-model="formData.phone"
                @input="delete errors.phone"
            />
            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
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
