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

$billing_address = view_data('billing_address');
$shipping_address = view_data('shipping_address');
$countries = view_data('countries') ?: [];
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'addresses']); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="{ editingAddress: null }">
                <div class="kecom-account-addresses">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title"><?php esc_html_e('Your Addresses', 'kirki-ecommerce'); ?></h3>
                    </div>

                    <p class="kecom-account-addresses-desc">
                        <?php esc_html_e('The following addresses will be used on the checkout page by default.', 'kirki-ecommerce'); ?>
                    </p>

                    <!-- Address Cards Grid -->
                    <div class="kecom-account-addresses-grid" x-show="!editingAddress">
                        <!-- Billing Address Card -->
                        <div class="kecom-account-addresses-card">
                            <div class="kecom-account-addresses-card-header">
                                <h4 class="kecom-account-addresses-card-header-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="20" height="14" x="2" y="5" rx="2" />
                                        <line x1="2" x2="22" y1="10" y2="10" />
                                    </svg>
                                    <?php esc_html_e('Billing Address', 'kirki-ecommerce'); ?>
                                </h4>
                            </div>

                            <div class="kecom-account-addresses-card-body">
                                <?php if (!empty($billing_address) && (!empty($billing_address->address_line1) || !empty($billing_address->first_name))) : ?>
                                    <address>
                                        <strong><?php echo esc_html(trim(($billing_address->first_name ?? '') . ' ' . ($billing_address->last_name ?? ''))); ?></strong>
                                        <?php if (!empty($billing_address->company)) : ?>
                                            <?php echo esc_html($billing_address->company); ?><br />
                                        <?php endif; ?>
                                        <?php echo esc_html($billing_address->address_line1 ?? ''); ?><br />
                                        <?php if (!empty($billing_address->address_line2)) : ?>
                                            <?php echo esc_html($billing_address->address_line2); ?><br />
                                        <?php endif; ?>
                                        <?php echo esc_html(($billing_address->city ?? '') . ', ' . ($billing_address->state ?? '') . ' ' . ($billing_address->postal_code ?? '')); ?><br />
                                        <?php echo esc_html($billing_address->country ?? ''); ?>
                                        <?php if (!empty($billing_address->phone)) : ?>
                                            <br /><?php printf(esc_html__('Phone: %s', 'kirki-ecommerce'), esc_html($billing_address->phone)); ?>
                                        <?php endif; ?>
                                    </address>
                                <?php else : ?>
                                    <p class="kecom-account-addresses-card-empty"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="kecom-account-addresses-card-footer">
                                <button
                                    type="button"
                                    class="kecom-btn kecom-btn-outline kecom-btn-sm"
                                    @click.prevent="editingAddress = 'billing'"
                                >
                                    <?php esc_html_e('Edit Billing Address', 'kirki-ecommerce'); ?>
                                </button>
                            </div>
                        </div>

                        <!-- Shipping Address Card -->
                        <div class="kecom-account-addresses-card">
                            <div class="kecom-account-addresses-card-header">
                                <h4 class="kecom-account-addresses-card-header-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <?php esc_html_e('Shipping Address', 'kirki-ecommerce'); ?>
                                </h4>
                            </div>

                            <div class="kecom-account-addresses-card-body">
                                <?php if (!empty($shipping_address) && (!empty($shipping_address->address_line1) || !empty($shipping_address->first_name))) : ?>
                                    <address>
                                        <strong><?php echo esc_html(trim(($shipping_address->first_name ?? '') . ' ' . ($shipping_address->last_name ?? ''))); ?></strong>
                                        <?php if (!empty($shipping_address->company)) : ?>
                                            <?php echo esc_html($shipping_address->company); ?><br />
                                        <?php endif; ?>
                                        <?php echo esc_html($shipping_address->address_line1 ?? ''); ?><br />
                                        <?php if (!empty($shipping_address->address_line2)) : ?>
                                            <?php echo esc_html($shipping_address->address_line2); ?><br />
                                        <?php endif; ?>
                                        <?php echo esc_html(($shipping_address->city ?? '') . ', ' . ($shipping_address->state ?? '') . ' ' . ($shipping_address->postal_code ?? '')); ?><br />
                                        <?php echo esc_html($shipping_address->country ?? ''); ?>
                                    </address>
                                <?php else : ?>
                                    <p class="kecom-account-addresses-card-empty"><?php esc_html_e('You have not set up this type of address yet.', 'kirki-ecommerce'); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="kecom-account-addresses-card-footer">
                                <button
                                    type="button"
                                    class="kecom-btn kecom-btn-outline kecom-btn-sm"
                                    @click.prevent="editingAddress = 'shipping'"
                                >
                                    <?php esc_html_e('Edit Shipping Address', 'kirki-ecommerce'); ?>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Edit Address Form Box -->
                    <div class="kecom-account-addresses-form-box" x-show="editingAddress" x-cloak>
                        <div class="kecom-account-addresses-form-box-header">
                            <h4 x-text="editingAddress === 'billing' ? '<?php esc_attr_e('Edit Billing Address', 'kirki-ecommerce'); ?>' : '<?php esc_attr_e('Edit Shipping Address', 'kirki-ecommerce'); ?>'"></h4>
                            <button type="button" class="kecom-btn kecom-btn-ghost kecom-btn-sm" @click.prevent="editingAddress = null">
                                <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                            </button>
                        </div>

                        <form method="post" action="" class="kecom-account-address-form">
                            <?php wp_nonce_field('kecom_save_address', 'kecom_address_nonce'); ?>
                            <input type="hidden" name="address_type" :value="editingAddress" />

                            <div class="kecom-address-form-grid">
                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="first_name" class="kecom-input" required />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="last_name" class="kecom-input" required />
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label"><?php esc_html_e('Company name (optional)', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="company" class="kecom-input" />
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Country / Region', 'kirki-ecommerce'); ?></label>
                                    <select name="country" class="kecom-select" required>
                                        <option value=""><?php esc_html_e('Select country', 'kirki-ecommerce'); ?></option>
                                        <?php foreach ($countries as $code => $country_name) : ?>
                                            <option value="<?php echo esc_attr($code); ?>"><?php echo esc_html($country_name); ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Street address', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="address_line1" class="kecom-input" placeholder="<?php esc_attr_e('House number and street name', 'kirki-ecommerce'); ?>" required />
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label"><?php esc_html_e('Apartment, suite, unit, etc. (optional)', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="address_line2" class="kecom-input" />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Town / City', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="city" class="kecom-input" required />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('State / County', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="state" class="kecom-input" required />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Postcode / ZIP', 'kirki-ecommerce'); ?></label>
                                    <input type="text" name="postal_code" class="kecom-input" required />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label"><?php esc_html_e('Phone (optional)', 'kirki-ecommerce'); ?></label>
                                    <input type="tel" name="phone" class="kecom-input" />
                                </div>
                            </div>

                            <div class="kecom-account-addresses-form-box-actions">
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
