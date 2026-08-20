<?php

/**
 * Account - Address Card Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

$type = $data['type'] ?? 'shipping';
$title = $data['title'] ?? ($type === 'billing' ? __('Billing Address', 'kirki-ecommerce') : __('Shipping Address', 'kirki-ecommerce'));
?>

<div class="kecom-card">
    <div class="kecom-card-header">
        <h3 class="kecom-card-title"><?php echo esc_html($title); ?></h3>
        <button
            type="button"
            class="kecom-btn kecom-btn-link kecom-btn-sm"
            <?php if ($type === 'billing') : ?>x-show="!sameAsShipping"<?php endif; ?>
            @click.prevent="startEdit('<?php echo esc_attr($type); ?>')"
        >
            <?php esc_html_e('Edit', 'kirki-ecommerce'); ?>
        </button>
    </div>

    <div class="kecom-card-body">
        <?php if ($type === 'billing') : ?>
            <div class="kecom-address-card-same">
                <label class="kecom-checkbox">
                    <input
                        class="kecom-checkbox-input"
                        type="checkbox"
                        x-model="sameAsShipping"
                        :disabled="togglingSameAsShipping"
                        @change="onSameAsShippingChange"
                    >
                    <span class="kecom-checkbox-label"><?php esc_html_e('Same as shipping address', 'kirki-ecommerce'); ?></span>
                </label>
            </div>
        <?php endif; ?>

        <template x-if="hasAddress('<?php echo esc_attr($type); ?>')">
            <address class="kecom-address-text">
                <span x-text="getDisplayName('<?php echo esc_attr($type); ?>')"></span>
                <template x-if="getAddress('<?php echo esc_attr($type); ?>')?.company">
                    <div><span x-text="getAddress('<?php echo esc_attr($type); ?>')?.company"></span></div>
                </template>
                <template x-if="getAddress('<?php echo esc_attr($type); ?>')?.address_line1">
                    <div><span x-text="getAddress('<?php echo esc_attr($type); ?>')?.address_line1"></span></div>
                </template>
                <template x-if="getAddress('<?php echo esc_attr($type); ?>')?.address_line2">
                    <div><span x-text="getAddress('<?php echo esc_attr($type); ?>')?.address_line2"></span></div>
                </template>
                <template x-if="getCityStateZip('<?php echo esc_attr($type); ?>')">
                    <div><span x-text="getCityStateZip('<?php echo esc_attr($type); ?>')"></span></div>
                </template>
                <template x-if="getCountryName(getAddress('<?php echo esc_attr($type); ?>')?.country)">
                    <div><span x-text="getCountryName(getAddress('<?php echo esc_attr($type); ?>')?.country)"></span></div>
                </template>
                <template x-if="getAddress('<?php echo esc_attr($type); ?>')?.phone">
                    <div><span><?php esc_html_e('Phone:', 'kirki-ecommerce'); ?> <span x-text="getAddress('<?php echo esc_attr($type); ?>')?.phone"></span></span></div>
                </template>
            </address>
        </template>
        <template x-if="!hasAddress('<?php echo esc_attr($type); ?>')">
            <p class="kecom-empty-text"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
        </template>
    </div>
</div>
