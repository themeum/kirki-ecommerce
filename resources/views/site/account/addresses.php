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
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user') ?: wp_get_current_user();
$billing_address = view_data('billing_address');
$shipping_address = view_data('shipping_address');
$countries = view_data('countries') ?: [];
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

$get_country_name = function ($code) use ($countries) {
    if (empty($code)) {
        return '';
    }
    foreach ($countries as $country) {
        if (($country['code'] ?? '') === $code) {
            return $country['name'] ?? $code;
        }
    }
    return $code;
};

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

$billing_display_name = trim($billing_first_name . ' ' . $billing_last_name) ?: ($user->display_name ?: '');
$shipping_display_name = trim($shipping_first_name . ' ' . $shipping_last_name) ?: ($user->display_name ?: '');

$has_billing = !empty($billing_address_line1) || !empty($billing_first_name);
$has_shipping = !empty($shipping_address_line1) || !empty($shipping_first_name);

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
    ],
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
            <main class="kecom-account-content" x-data="{
                editingAddress: null,
                addresses: <?php echo esc_attr(wp_json_encode($addresses_payload)); ?>,
                formData: {
                    first_name: '',
                    last_name: '',
                    company: '',
                    country: '',
                    address_line1: '',
                    address_line2: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    phone: ''
                },
                startEdit(type) {
                    this.editingAddress = type;
                    this.formData = Object.assign({}, this.addresses[type] || {});
                }
            }">
                <div class="kecom-account-addresses-page">
                    <h1 class="kecom-account-addresses-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></h1>

                    <!-- Address Cards Grid -->
                    <div class="kecom-account-addresses-grid" x-show="!editingAddress">
                        <!-- Billing Address Card -->
                        <div class="kecom-card">
                            <div class="kecom-card-header">
                                <h3 class="kecom-card-title"><?php esc_html_e('Billing Address', 'kirki-ecommerce'); ?></h3>
                                <button
                                    type="button"
                                    class="kecom-btn kecom-btn-outline kecom-btn-sm"
                                    @click.prevent="startEdit('billing')"
                                >
                                    <?php esc_html_e('Edit', 'kirki-ecommerce'); ?>
                                </button>
                            </div>

                            <div class="kecom-card-body">
                                <?php if ($has_billing) : ?>
                                    <address class="kecom-address-text">
                                        <?php echo esc_html($billing_display_name); ?>
                                        <?php if (!empty($billing_company)) : ?>
                                            <br /><?php echo esc_html($billing_company); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($billing_address_line1)) : ?>
                                            <br /><?php echo esc_html($billing_address_line1); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($billing_address_line2)) : ?>
                                            <br /><?php echo esc_html($billing_address_line2); ?>
                                        <?php endif; ?>
                                        <?php
                                        $billing_city_state_zip = trim(implode(', ', array_filter([$billing_city, $billing_state])) . ' ' . $billing_postal_code);
                                        if (!empty($billing_city_state_zip)) : ?>
                                            <br /><?php echo esc_html($billing_city_state_zip); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($billing_country)) : ?>
                                            <br /><?php echo esc_html($get_country_name($billing_country)); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($billing_phone)) : ?>
                                            <br /><?php printf(esc_html__('Phone: %s', 'kirki-ecommerce'), esc_html($billing_phone)); ?>
                                        <?php endif; ?>
                                    </address>
                                <?php else : ?>
                                    <p class="kecom-text-subdued"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Shipping Address Card -->
                        <div class="kecom-card">
                            <div class="kecom-card-header">
                                <h3 class="kecom-card-title"><?php esc_html_e('Shipping Address', 'kirki-ecommerce'); ?></h3>
                                <button
                                    type="button"
                                    class="kecom-btn kecom-btn-outline kecom-btn-sm"
                                    @click.prevent="startEdit('shipping')"
                                >
                                    <?php esc_html_e('Edit', 'kirki-ecommerce'); ?>
                                </button>
                            </div>

                            <div class="kecom-card-body">
                                <?php if ($has_shipping) : ?>
                                    <address class="kecom-address-text">
                                        <?php echo esc_html($shipping_display_name); ?>
                                        <?php if (!empty($shipping_company)) : ?>
                                            <br /><?php echo esc_html($shipping_company); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($shipping_address_line1)) : ?>
                                            <br /><?php echo esc_html($shipping_address_line1); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($shipping_address_line2)) : ?>
                                            <br /><?php echo esc_html($shipping_address_line2); ?>
                                        <?php endif; ?>
                                        <?php
                                        $shipping_city_state_zip = trim(implode(', ', array_filter([$shipping_city, $shipping_state])) . ' ' . $shipping_postal_code);
                                        if (!empty($shipping_city_state_zip)) : ?>
                                            <br /><?php echo esc_html($shipping_city_state_zip); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($shipping_country)) : ?>
                                            <br /><?php echo esc_html($get_country_name($shipping_country)); ?>
                                        <?php endif; ?>
                                        <?php if (!empty($shipping_phone)) : ?>
                                            <br /><?php printf(esc_html__('Phone: %s', 'kirki-ecommerce'), esc_html($shipping_phone)); ?>
                                        <?php endif; ?>
                                    </address>
                                <?php else : ?>
                                    <p class="kecom-text-subdued"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Edit Address Form Box -->
                    <div class="kecom-card" x-show="editingAddress" x-cloak>
                        <div class="kecom-card-header">
                            <h3 class="kecom-card-title" x-text="editingAddress === 'billing' ? '<?php esc_attr_e('Edit Billing Address', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('Edit Shipping Address', 'kirki-ecommerce'); ?>'"></h3>
                            <button type="button" class="kecom-btn kecom-btn-outline kecom-btn-sm" @click.prevent="editingAddress = null">
                                <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                            </button>
                        </div>

                        <form method="post" action="" class="kecom-form">
                            <?php wp_nonce_field('kecom_save_address', 'kecom_address_nonce'); ?>
                            <input type="hidden" name="address_type" :value="editingAddress" />

                            <div class="kecom-form-row">
                                <div class="kecom-field">
                                    <label for="address_first_name" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="address_first_name"
                                        name="first_name"
                                        class="kecom-input"
                                        x-model="formData.first_name"
                                        required
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label for="address_last_name" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="address_last_name"
                                        name="last_name"
                                        class="kecom-input"
                                        x-model="formData.last_name"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="kecom-field">
                                <label for="address_company" class="kecom-field-label"><?php esc_html_e('Company name (optional)', 'kirki-ecommerce'); ?></label>
                                <input
                                    type="text"
                                    id="address_company"
                                    name="company"
                                    class="kecom-input"
                                    x-model="formData.company"
                                />
                            </div>

                            <div class="kecom-field">
                                <label for="address_country" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Country / Region', 'kirki-ecommerce'); ?></label>
                                <select
                                    id="address_country"
                                    name="country"
                                    class="kecom-select"
                                    x-model="formData.country"
                                    required
                                >
                                    <option value=""><?php esc_html_e('Select country', 'kirki-ecommerce'); ?></option>
                                    <?php foreach ($countries as $country) :
                                        $country_code = $country['code'] ?? ($country['id'] ?? '');
                                        $country_title = $country['name'] ?? $country_code;
                                    ?>
                                        <option value="<?php echo esc_attr($country_code); ?>">
                                            <?php echo esc_html($country_title); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="kecom-field">
                                <label for="address_line1" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Street address', 'kirki-ecommerce'); ?></label>
                                <input
                                    type="text"
                                    id="address_line1"
                                    name="address_line1"
                                    class="kecom-input"
                                    placeholder="<?php esc_attr_e('House number and street name', 'kirki-ecommerce'); ?>"
                                    x-model="formData.address_line1"
                                    required
                                />
                            </div>

                            <div class="kecom-field">
                                <label for="address_line2" class="kecom-field-label"><?php esc_html_e('Apartment, suite, unit, etc. (optional)', 'kirki-ecommerce'); ?></label>
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
                                    <label for="address_city" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Town / City', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="address_city"
                                        name="city"
                                        class="kecom-input"
                                        x-model="formData.city"
                                        required
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label for="address_state" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('State / County', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="address_state"
                                        name="state"
                                        class="kecom-input"
                                        x-model="formData.state"
                                        required
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label for="address_postal_code" class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Postcode / ZIP', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="address_postal_code"
                                        name="postal_code"
                                        class="kecom-input"
                                        x-model="formData.postal_code"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="kecom-field">
                                <label for="address_phone" class="kecom-field-label"><?php esc_html_e('Phone (optional)', 'kirki-ecommerce'); ?></label>
                                <input
                                    type="tel"
                                    id="address_phone"
                                    name="phone"
                                    class="kecom-input"
                                    x-model="formData.phone"
                                />
                            </div>

                            <div class="kecom-card-footer" style="gap: 12px;">
                                <button type="submit" class="kecom-btn kecom-btn-primary">
                                    <?php esc_html_e('Save Address', 'kirki-ecommerce'); ?>
                                </button>
                                <button type="button" class="kecom-btn kecom-btn-outline" @click.prevent="editingAddress = null">
                                    <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
