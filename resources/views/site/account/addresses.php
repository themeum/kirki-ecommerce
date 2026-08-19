<?php

/**
 * Account - Addresses Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Utils;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user') ?: wp_get_current_user();
$customer = view_data('customer');
$billing_address = view_data('billing_address');
$shipping_address = view_data('shipping_address');
$countries = view_data('countries') ?: Utils::get_countries();
$pages = view_data('pages');

$get_address_val = function ($addr, string $key, string $default = '') {
    if (is_object($addr)) {
        return $addr->$key ?? $default;
    }
    if (is_array($addr)) {
        return $addr[$key] ?? $default;
    }
    return $default;
};

$customer_id = $customer ? ($customer->id ?? 1) : 1;

// Billing field values
$billing_first_name = $get_address_val($billing_address, 'first_name', $user->first_name ?: '');
$billing_last_name = $get_address_val($billing_address, 'last_name', $user->last_name ?: '');
$billing_company = $get_address_val($billing_address, 'company');
$billing_country = $get_address_val($billing_address, 'country');
$billing_address_line1 = $get_address_val($billing_address, 'address_line1');
$billing_address_line2 = $get_address_val($billing_address, 'address_line2');
$billing_city = $get_address_val($billing_address, 'city');
$billing_state = $get_address_val($billing_address, 'state');
$billing_postal_code = $get_address_val($billing_address, 'postal_code');
$billing_phone = $get_address_val($billing_address, 'phone');
$billing_email = $get_address_val($billing_address, 'email', $user->user_email ?: '');

// Shipping field values
$shipping_first_name = $get_address_val($shipping_address, 'first_name', $user->first_name ?: '');
$shipping_last_name = $get_address_val($shipping_address, 'last_name', $user->last_name ?: '');
$shipping_company = $get_address_val($shipping_address, 'company');
$shipping_country = $get_address_val($shipping_address, 'country');
$shipping_address_line1 = $get_address_val($shipping_address, 'address_line1');
$shipping_address_line2 = $get_address_val($shipping_address, 'address_line2');
$shipping_city = $get_address_val($shipping_address, 'city');
$shipping_state = $get_address_val($shipping_address, 'state');
$shipping_postal_code = $get_address_val($shipping_address, 'postal_code');
$shipping_phone = $get_address_val($shipping_address, 'phone');
$shipping_email = $get_address_val($shipping_address, 'email', $user->user_email ?: '');

$customer_data = [
    'id'                => $customer_id,
    'first_name'        => $customer ? ($customer->first_name ?? $user->first_name) : $user->first_name,
    'last_name'         => $customer ? ($customer->last_name ?? $user->last_name) : $user->last_name,
    'email'             => $customer ? ($customer->email ?? $user->user_email) : $user->user_email,
    'phone'             => $customer ? ($customer->phone ?? '') : '',
    'photo'             => $customer ? ($customer->photo ?? null) : null,
    'accepts_marketing' => $customer ? (bool)($customer->accepts_marketing ?? false) : false,
    'notes'             => $customer ? ($customer->notes ?? null) : null,
    'language'                    => $customer ? ($customer->language ?? 'en') : 'en',
    'tags'                        => $customer ? ($customer->tags ?? []) : [],
    'is_billing_same_as_shipping' => $customer ? (bool)($customer->is_billing_same_as_shipping ?? false) : false,
];

$addresses_payload = [
    'billing' => [
        'first_name'    => $billing_first_name,
        'last_name'     => $billing_last_name,
        'company'       => $billing_company,
        'country'       => $billing_country,
        'address_line1' => $billing_address_line1,
        'address_line2' => $billing_address_line2,
        'city'          => $billing_city,
        'state'         => $billing_state,
        'postal_code'   => $billing_postal_code,
        'phone'         => $billing_phone,
        'email'         => $billing_email,
    ],
    'shipping' => [
        'first_name'    => $shipping_first_name,
        'last_name'     => $shipping_last_name,
        'company'       => $shipping_company,
        'country'       => $shipping_country,
        'address_line1' => $shipping_address_line1,
        'address_line2' => $shipping_address_line2,
        'city'          => $shipping_city,
        'state'         => $shipping_state,
        'postal_code'   => $shipping_postal_code,
        'phone'         => $shipping_phone,
        'email'         => $shipping_email,
    ],
];

$addresses_config = [
    'customerId'   => $customer_id,
    'customerData' => $customer_data,
    'addresses'    => $addresses_payload,
];
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountAddresses(<?php echo esc_attr(wp_json_encode($addresses_config)); ?>)">
                <div class="kecom-account-addresses-page">
                    <h1 class="kecom-account-addresses-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></h1>

                    <!-- Address Cards Grid -->
                    <div class="kecom-account-addresses-grid" x-show="!editingAddress">
                        <?php include_view('site.account.parts.address-card', ['type' => 'billing', 'title' => __('Billing Address', 'kirki-ecommerce')]); ?>
                        <?php include_view('site.account.parts.address-card', ['type' => 'shipping', 'title' => __('Shipping Address', 'kirki-ecommerce')]); ?>
                    </div>

                    <!-- Edit Address Form Box -->
                    <?php include_view('site.account.parts.address-form'); ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
