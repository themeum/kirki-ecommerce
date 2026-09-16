<?php

/**
 * Checkout - Address Picker Modal Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<!-- Address Picker Modal Backdrop -->
<div
    class="kecom-modal-backdrop"
    x-show="shippingPickerOpen || billingPickerOpen"
    x-transition.opacity
    x-cloak
></div>

<!-- Address Picker Modal -->
<div
    class="kecom-modal"
    x-show="shippingPickerOpen || billingPickerOpen"
    x-transition
    x-cloak
    @keydown.escape.window="!modalOpen && closeAddressPicker()"
>
    <div
        class="kecom-modal-content kecom-modal-content-md kecom-checkout-address-picker-modal"
        @click.outside="!modalOpen && closeAddressPicker()"
    >
        <div class="kecom-modal-header">
            <h3 class="kecom-modal-header-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></h3>
            <button
                type="button"
                class="kecom-modal-header-close"
                @click.prevent="closeAddressPicker"
                aria-label="<?php esc_attr_e('Close', 'kirki-ecommerce'); ?>"
            >
                <?php Icon::render('cross', ['size' => 16]); ?>
            </button>
        </div>

        <div class="kecom-modal-body">
            <div class="kecom-checkout-address-picker-list">
                <template x-for="address in savedAddresses" :key="address.id">
                    <label
                        class="kecom-checkout-address-picker-card"
                        :class="{ 'is-selected': String(tempSelectedAddressId) === String(address.id) }"
                    >
                        <div class="kecom-checkout-address-picker-radio">
                            <input
                                type="radio"
                                name="checkout_address_selection"
                                class="kecom-radio-input"
                                :value="address.id"
                                :checked="String(tempSelectedAddressId) === String(address.id)"
                                @change="tempSelectedAddressId = address.id"
                            />
                        </div>

                        <div class="kecom-checkout-address-picker-details">
                            <div class="kecom-checkout-address-picker-row">
                                <div class="kecom-checkout-address-picker-label-group">
                                    <span class="kecom-checkout-address-picker-icon" x-show="address.type === 'home' || !address.type"><?php Icon::render('home'); ?></span>
                                    <span class="kecom-checkout-address-picker-icon" x-show="address.type === 'work' || address.type === 'office'"><?php Icon::render('briefcase'); ?></span>
                                    <span class="kecom-checkout-address-picker-icon" x-show="address.type === 'other' || address.type === 'others'"><?php Icon::render('map-pin'); ?></span>
                                    <span class="kecom-checkout-address-picker-label" x-text="getAddressLabel(address)"></span>
                                </div>
                                <div class="kecom-checkout-address-picker-text">
                                    <span x-text="getFormattedAddressFirstLine(address)"></span>
                                    <span x-text="getFormattedAddressSecondLine(address)"></span>
                                </div>
                            </div>

                            <button
                                type="button"
                                class="kecom-btn kecom-btn-ghost kecom-btn-sm kecom-btn-icon"
                                @click.stop.prevent="openEditModal(address)"
                                aria-label="<?php esc_attr_e('Edit address', 'kirki-ecommerce'); ?>"
                            >
                                <?php Icon::render('edit', ['size' => 16]); ?>
                            </button>
                        </div>
                    </label>
                </template>
            </div>

            <div>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-link"
                    @click.prevent="openAddModal"
                >
                    <?php Icon::render('plus', ['size' => 16]); ?>
                    <span><?php esc_html_e('Add new address', 'kirki-ecommerce'); ?></span>
                </button>
            </div>
        </div>

        <div class="kecom-modal-footer">
            <button
                type="button"
                class="kecom-btn kecom-btn-outline"
                @click.prevent="closeAddressPicker"
            >
                <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
            </button>
            <button
                type="button"
                class="kecom-btn kecom-btn-primary"
                :disabled="!tempSelectedAddressId"
                @click.prevent="confirmAddressSelection"
            >
                <?php esc_html_e('Add', 'kirki-ecommerce'); ?>
            </button>
        </div>
    </div>
</div>
