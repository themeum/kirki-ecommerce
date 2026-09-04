<?php

/**
 * Account - Address Add/Edit Modal Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<!-- Address Modal Backdrop -->
<div
    class="kecom-modal-backdrop"
    x-show="modalOpen"
    x-transition.opacity
    x-cloak
></div>

<!-- Address Modal -->
<div
    class="kecom-modal"
    x-show="modalOpen"
    x-transition
    x-cloak
    @keydown.escape.window="closeModal"
>
    <div
        class="kecom-modal-content kecom-modal-content-md kecom-address-modal-content"
        @click.outside="closeModal"
    >
        <div class="kecom-modal-header">
            <h3 class="kecom-modal-header-title" x-text="isEditing ? '<?php esc_attr_e('Edit Address', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('Add New Address', 'kirki-ecommerce'); ?>'"></h3>
            <button
                type="button"
                class="kecom-modal-header-close"
                @click.prevent="closeModal"
                aria-label="<?php esc_attr_e('Close', 'kirki-ecommerce'); ?>"
            >
                <?php Icon::render('cross', ['size' => 16]); ?>
            </button>
        </div>

        <form @submit.prevent="saveAddress" class="kecom-form">
            <div class="kecom-modal-body">
                <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.country }">
                    <label for="modal_address_country" class="kecom-field-label"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
                    <select
                        id="modal_address_country"
                        name="country"
                        class="kecom-select"
                        :class="{ 'kecom-input-error': errors.country }"
                        x-model="formData.country"
                        @change="formData.state = ''; delete errors.country; delete errors.state"
                    >
                        <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                        <template x-for="country in countries" :key="country.code || country.id">
                            <option :value="country.code || country.id" x-text="country.name"></option>
                        </template>
                    </select>
                    <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
                </div>

                <div class="kecom-form-row">
                    <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.first_name }">
                        <label for="modal_address_first_name" class="kecom-field-label"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                        <input
                            type="text"
                            id="modal_address_first_name"
                            name="first_name"
                            class="kecom-input"
                            :class="{ 'kecom-input-error': errors.first_name }"
                            x-model="formData.first_name"
                            @input="delete errors.first_name"
                        />
                        <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
                    </div>

                    <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.last_name }">
                        <label for="modal_address_last_name" class="kecom-field-label"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                        <input
                            type="text"
                            id="modal_address_last_name"
                            name="last_name"
                            class="kecom-input"
                            :class="{ 'kecom-input-error': errors.last_name }"
                            x-model="formData.last_name"
                            @input="delete errors.last_name"
                        />
                        <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
                    </div>
                </div>

                <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.address_line1 }">
                    <label for="modal_address_line1" class="kecom-field-label"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
                    <input
                        type="text"
                        id="modal_address_line1"
                        name="address_line1"
                        class="kecom-input"
                        :class="{ 'kecom-input-error': errors.address_line1 }"
                        placeholder="<?php esc_attr_e('123 Street Rd', 'kirki-ecommerce'); ?>"
                        x-model="formData.address_line1"
                        @input="delete errors.address_line1"
                    />
                    <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
                </div>

                <div class="kecom-field">
                    <label for="modal_address_line2" class="kecom-field-label"><?php esc_html_e('Apartment, suit, etc. (optional)', 'kirki-ecommerce'); ?></label>
                    <input
                        type="text"
                        id="modal_address_line2"
                        name="address_line2"
                        class="kecom-input"
                        placeholder="<?php esc_attr_e('Apt 4B, San', 'kirki-ecommerce'); ?>"
                        x-model="formData.address_line2"
                    />
                </div>

                <div class="kecom-form-row kecom-form-row-3">
                    <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.city }">
                        <label for="modal_address_city" class="kecom-field-label"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                        <input
                            type="text"
                            id="modal_address_city"
                            name="city"
                            class="kecom-input"
                            :class="{ 'kecom-input-error': errors.city }"
                            x-model="formData.city"
                            @input="delete errors.city"
                        />
                        <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
                    </div>

                    <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.state }">
                        <label for="modal_address_state" class="kecom-field-label"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                        <template x-if="availableStates.length > 0">
                            <select
                                id="modal_address_state"
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
                        </template>
                        <template x-if="availableStates.length === 0">
                            <input
                                type="text"
                                id="modal_address_state_text"
                                name="state"
                                class="kecom-input"
                                x-model="formData.state"
                                placeholder="<?php esc_attr_e('State', 'kirki-ecommerce'); ?>"
                            />
                        </template>
                        <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
                    </div>

                    <div class="kecom-field" :class="{ 'kecom-field-error-state': errors.postal_code }">
                        <label for="modal_address_postal_code" class="kecom-field-label"><?php esc_html_e('Zip code', 'kirki-ecommerce'); ?></label>
                        <input
                            type="text"
                            id="modal_address_postal_code"
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
                    <label for="modal_address_phone" class="kecom-field-label"><?php esc_html_e('Phone', 'kirki-ecommerce'); ?></label>
                    <input
                        type="tel"
                        id="modal_address_phone"
                        name="phone"
                        class="kecom-input"
                        :class="{ 'kecom-input-error': errors.phone }"
                        placeholder="<?php esc_attr_e('Phone number', 'kirki-ecommerce'); ?>"
                        x-model="formData.phone"
                        @input="delete errors.phone"
                    />
                    <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
                </div>

                <div class="kecom-field">
                    <label for="modal_address_label" class="kecom-field-label"><?php esc_html_e('Address label', 'kirki-ecommerce'); ?></label>
                    <input
                        type="text"
                        id="modal_address_label"
                        name="label"
                        class="kecom-input"
                        placeholder="<?php esc_attr_e('Other', 'kirki-ecommerce'); ?>"
                        x-model="formData.label"
                    />
                </div>

                <div class="kecom-address-modal-defaults">
                    <label class="kecom-checkbox">
                        <input
                            type="checkbox"
                            class="kecom-checkbox-input"
                            x-model="formData.is_default_shipping"
                        />
                        <span class="kecom-checkbox-label"><?php esc_html_e('Set as default shipping address', 'kirki-ecommerce'); ?></span>
                    </label>

                    <label class="kecom-checkbox">
                        <input
                            type="checkbox"
                            class="kecom-checkbox-input"
                            x-model="formData.is_default_billing"
                        />
                        <span class="kecom-checkbox-label"><?php esc_html_e('Set as default billing address', 'kirki-ecommerce'); ?></span>
                    </label>
                </div>
            </div>

            <div class="kecom-modal-footer">
                <button type="button" class="kecom-btn kecom-btn-outline" :disabled="loading" @click.prevent="closeModal">
                    <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                </button>
                <button type="submit" class="kecom-btn kecom-btn-primary" :class="{ 'kecom-btn-loading': loading }" :disabled="loading">
                    <?php esc_html_e('Save', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </form>
    </div>
</div>
