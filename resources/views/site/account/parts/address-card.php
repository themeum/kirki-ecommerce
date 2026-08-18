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

$type = $data['type'] ?? 'billing';
$title = $data['title'] ?? ($type === 'billing' ? __('Billing Address', 'kirki-ecommerce') : __('Shipping Address', 'kirki-ecommerce'));
?>

<div class="kecom-card">
    <div class="kecom-card-header">
        <h3 class="kecom-card-title"><?php echo esc_html($title); ?></h3>
        <button
            type="button"
            class="kecom-btn kecom-btn-outline kecom-btn-sm"
            @click.prevent="startEdit('<?php echo esc_attr($type); ?>')"
        >
            <?php esc_html_e('Edit', 'kirki-ecommerce'); ?>
        </button>
    </div>

    <div class="kecom-card-body">
        <template x-if="hasAddress('<?php echo esc_attr($type); ?>')">
            <address class="kecom-address-text">
                <span x-text="getDisplayName('<?php echo esc_attr($type); ?>')"></span>
                <template x-if="addresses['<?php echo esc_attr($type); ?>']?.company">
                    <div><span x-text="addresses['<?php echo esc_attr($type); ?>']?.company"></span></div>
                </template>
                <template x-if="addresses['<?php echo esc_attr($type); ?>']?.address_line1">
                    <div><span x-text="addresses['<?php echo esc_attr($type); ?>']?.address_line1"></span></div>
                </template>
                <template x-if="addresses['<?php echo esc_attr($type); ?>']?.address_line2">
                    <div><span x-text="addresses['<?php echo esc_attr($type); ?>']?.address_line2"></span></div>
                </template>
                <template x-if="getCityStateZip('<?php echo esc_attr($type); ?>')">
                    <div><span x-text="getCityStateZip('<?php echo esc_attr($type); ?>')"></span></div>
                </template>
                <template x-if="getCountryName(addresses['<?php echo esc_attr($type); ?>']?.country)">
                    <div><span x-text="getCountryName(addresses['<?php echo esc_attr($type); ?>']?.country)"></span></div>
                </template>
                <template x-if="addresses['<?php echo esc_attr($type); ?>']?.phone">
                    <div><span><?php esc_html_e('Phone:', 'kirki-ecommerce'); ?> <span x-text="addresses['<?php echo esc_attr($type); ?>']?.phone"></span></span></div>
                </template>
            </address>
        </template>
        <template x-if="!hasAddress('<?php echo esc_attr($type); ?>')">
            <p class="kecom-text-subdued"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
        </template>
    </div>
</div>
