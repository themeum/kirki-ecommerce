<?php

/**
 * Account Dashboard Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user');
$customer = view_data('customer');
$pages = view_data('pages');
$orders = view_data('orders', []);

$display_name = $user->display_name ?: $user->user_login ?: __('Customer', 'kirki-ecommerce');
$user_email = $user->user_email ?: '';

$billing_address = $customer ? $customer->get_billing_address() : null;
$shipping_address = $customer ? $customer->get_shipping_address() : null;
$register_since = $user ? date('M j, Y', strtotime($user->user_registered)) : '';
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-account-dashboard">
                    <!-- Welcome Greeting -->
                    <div class="kecom-account-welcome">
                        <span class="kecom-account-welcome-label"><?php esc_html_e('Welcome back,', 'kirki-ecommerce'); ?></span>
                        <h1 class="kecom-account-welcome-name"><?php echo esc_html($display_name); ?></h1>
                    </div>

                    <!-- Recent Orders Section -->
                    <div class="kecom-account-recent-orders-section">
                        <div class="kecom-account-section-header">
                            <h2 class="kecom-account-section-title"><?php esc_html_e('Recent Orders', 'kirki-ecommerce'); ?></h2>
                            <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>" class="kecom-account-section-link">
                                <?php esc_html_e('View All Orders', 'kirki-ecommerce'); ?>
                            </a>
                        </div>

                        <!-- Orders List Partial -->
                        <?php include_view('site.account.orders.table', ['orders' => $orders['results']]); ?>
                    </div>

                    <!-- Account Details & Saved Addresses Cards -->
                    <div class="kecom-account-cards-grid">
                        <!-- Account Details Card -->
                        <div class="kecom-card">
                            <div class="kecom-card-header">
                                <h3 class="kecom-card-title"><?php esc_html_e('Account Details', 'kirki-ecommerce'); ?></h3>
                                <a href="<?php echo esc_url(Url::get_account_url('account-details')); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                                    <?php esc_html_e('Edit', 'kirki-ecommerce'); ?>
                                </a>
                            </div>

                            <div class="kecom-card-body">
                                <div class="kecom-account-field">
                                    <span class="kecom-account-field-label"><?php esc_html_e('FULL NAME', 'kirki-ecommerce'); ?></span>
                                    <span class="kecom-account-field-value"><?php echo esc_html($display_name); ?></span>
                                </div>

                                <div class="kecom-account-field">
                                    <span class="kecom-account-field-label"><?php esc_html_e('EMAIL ADDRESS', 'kirki-ecommerce'); ?></span>
                                    <span class="kecom-account-field-value"><?php echo esc_html($user_email); ?></span>
                                </div>

                                <div class="kecom-account-field">
                                    <span class="kecom-account-field-label"><?php esc_html_e('REGISTERED SINCE', 'kirki-ecommerce'); ?></span>
                                    <span class="kecom-account-field-value"><?php echo esc_html($register_since); ?></span>
                                </div>
                            </div>
                        </div>

                        <!-- Saved Addresses Card -->
                        <div class="kecom-card">
                            <div class="kecom-card-header">
                                <h3 class="kecom-card-title"><?php esc_html_e('Saved Addresses', 'kirki-ecommerce'); ?></h3>
                                <a href="<?php echo esc_url(Url::get_account_url('addresses')); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                                    <?php esc_html_e('Manage', 'kirki-ecommerce'); ?>
                                </a>
                            </div>

                            <div class="kecom-card-body kecom-addresses-split">
                                <div class="kecom-account-address-col">
                                    <span class="kecom-account-field-label"><?php esc_html_e('SHIPPING ADDRESS', 'kirki-ecommerce'); ?></span>
                                    <div class="kecom-account-address-lines">
                                        <?php if (!empty($shipping_address) && (!empty($shipping_address->address_line1) || !empty($shipping_address->first_name))) : ?>
                                            <p><?php echo esc_html(trim(($shipping_address->first_name ?? '') . ' ' . ($shipping_address->last_name ?? '')) ?: $display_name); ?></p>
                                            <p><?php echo esc_html($shipping_address->address_line1 ?? ''); ?></p>
                                            <p><?php echo esc_html(trim(($shipping_address->city ?? '') . ', ' . ($shipping_address->state ?? '') . ' ' . ($shipping_address->postal_code ?? ''))); ?></p>
                                            <p><?php echo esc_html($shipping_address->country ?? ''); ?></p>
                                        <?php else : ?>
                                            <p><?php echo esc_html($display_name); ?></p>
                                            <p class="kecom-empty-text"><?php esc_html_e('No shipping address added yet.', 'kirki-ecommerce'); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="kecom-account-address-col">
                                    <span class="kecom-account-field-label"><?php esc_html_e('BILLING ADDRESS', 'kirki-ecommerce'); ?></span>
                                    <div class="kecom-account-address-lines">
                                        <?php if (!empty($billing_address) && (!empty($billing_address->address_line1) || !empty($billing_address->first_name))) : ?>
                                            <p><?php echo esc_html(trim(($billing_address->first_name ?? '') . ' ' . ($billing_address->last_name ?? '')) ?: $display_name); ?></p>
                                            <p><?php echo esc_html($billing_address->address_line1 ?? ''); ?></p>
                                            <p><?php echo esc_html(trim(($billing_address->city ?? '') . ', ' . ($billing_address->state ?? '') . ' ' . ($billing_address->postal_code ?? ''))); ?></p>
                                            <p><?php echo esc_html($billing_address->country ?? ''); ?></p>
                                        <?php else : ?>
                                            <p><?php echo esc_html($display_name); ?></p>
                                            <p class="kecom-empty-text"><?php esc_html_e('No billing address added yet.', 'kirki-ecommerce'); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
