<?php

/**
 * Account - Address Card Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use Kirki\Ecommerce\App\Supports\Icon;

use function Kirki\Ecommerce\Framework\include_view;

defined('ABSPATH') || exit;
?>

<div class="kecom-card kecom-address-card" x-cloak>
    <div class="kecom-address-card-header">
        <div class="kecom-address-card-title-group">
            <div class="kecom-address-card-title-icon-group">
                <span x-show="address.type === 'home' || !address.type"><?php Icon::render('home'); ?></span>
                <span x-show="address.type === 'work' || address.type === 'office'"><?php Icon::render('briefcase'); ?></span>
                <span x-show="address.type === 'other' || address.type === 'others'"><?php Icon::render('map-pin'); ?></span>
                <h3 class="kecom-address-card-label" x-text="getAddressLabel(address)"></h3>
            </div>
            <div class="kecom-address-card-badges">
                <span class="kecom-badge kecom-badge-info-light" x-show="address.is_default_billing">
                    <?php esc_html_e('Default Billing', 'kirki-ecommerce'); ?>
                </span>
                <span class="kecom-badge kecom-badge-info-light" x-show="address.is_default_shipping">
                    <?php esc_html_e('Default Shipping', 'kirki-ecommerce'); ?>
                </span>
            </div>
        </div>

        <!-- Action popover menu -->
        <div class="kecom-address-card-actions">
            <?php
            include_view('site.components.popover', [
                'placement'     => 'bottom-end',
                'trigger_label' => __('Address options', 'kirki-ecommerce'),
                'trigger_icon'  => 'dots-vertical',
                'items'         => [
                    [
                        'label' => __('Edit Address', 'kirki-ecommerce'),
                        'click' => 'openEditModal(address)',
                    ],
                    [
                        'label'        => __('Set as Default Shipping', 'kirki-ecommerce'),
                        'click'        => "setDefault(address.id, 'shipping')",
                        'bind_class'   => "{ 'is-disabled': address.is_default_shipping }",
                        'bind_disable' => 'address.is_default_shipping',
                    ],
                    [
                        'label'        => __('Set as Default Billing', 'kirki-ecommerce'),
                        'click'        => "setDefault(address.id, 'billing')",
                        'bind_class'   => "{ 'is-disabled': address.is_default_billing }",
                        'bind_disable' => 'address.is_default_billing',
                    ],
                    [
                        'type' => 'divider',
                    ],
                    [
                        'label'     => __('Delete', 'kirki-ecommerce'),
                        'click'     => 'deleteAddress(address.id)',
                        'is_danger' => true,
                    ],
                ],
            ]);
            ?>
        </div>
    </div>

    <div class="kecom-address-card-body">
        <address class="kecom-address-text">
            <div class="kecom-address-name" x-text="`${address.first_name || ''} ${address.last_name || ''}`.trim()"></div>
            <div class="kecom-address-line" x-show="getFormattedAddressLines(address)" x-text="getFormattedAddressLines(address)"></div>
            <div class="kecom-address-city-zip" x-show="getCityStateZip(address)" x-text="getCityStateZip(address)"></div>
            <div class="kecom-address-country" x-show="getCountryName(address.country)" x-text="getCountryName(address.country)"></div>
            <div class="kecom-address-phone" x-show="address.phone" x-text="address.phone"></div>
            <div class="kecom-address-email" x-show="address.email" x-text="address.email"></div>
        </address>
    </div>
</div>