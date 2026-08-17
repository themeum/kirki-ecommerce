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

$user = view_data('user') ?: wp_get_current_user();
$display_name = $user->display_name ?: $user->user_login ?: __('Customer', 'kirki-ecommerce');
$orders = view_data('orders') ?: [];
$orders_count = count($orders);
$logout_url = wp_logout_url(Url::get_account_url());
$recent_orders = array_slice($orders, 0, 5);

$pages = $data['pages'] ?? [];
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
                    <!-- Welcome Banner -->
                    <div class="kecom-account-dashboard-welcome">
                        <div class="kecom-account-dashboard-welcome-text">
                            <h3><?php printf(esc_html__('Hello, %s!', 'kirki-ecommerce'), esc_html($display_name)); ?></h3>
                            <p><?php esc_html_e('From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.', 'kirki-ecommerce'); ?></p>
                        </div>
                        <a href="<?php echo esc_url($logout_url); ?>" class="kecom-account-dashboard-welcome-logout">
                            <?php esc_html_e('Log Out', 'kirki-ecommerce'); ?>
                        </a>
                    </div>

                    <!-- Quick Stat Cards -->
                    <div class="kecom-account-dashboard-stats">
                        <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>" class="kecom-account-dashboard-stat-card">
                            <div class="kecom-account-dashboard-stat-card-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m7.5 4.27 9 5.15" />
                                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                    <path d="m3.3 7 8.7 5 8.7-5" />
                                    <path d="M12 22V12" />
                                </svg>
                            </div>
                            <div class="kecom-account-dashboard-stat-card-details">
                                <span class="kecom-account-dashboard-stat-card-title"><?php esc_html_e('Total Orders', 'kirki-ecommerce'); ?></span>
                                <span class="kecom-account-dashboard-stat-card-value"><?php echo esc_html($orders_count); ?></span>
                                <span class="kecom-account-dashboard-stat-card-subtext"><?php esc_html_e('View order history &rarr;', 'kirki-ecommerce'); ?></span>
                            </div>
                        </a>

                        <a href="<?php echo esc_url(Url::get_account_url('addresses')); ?>" class="kecom-account-dashboard-stat-card">
                            <div class="kecom-account-dashboard-stat-card-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div class="kecom-account-dashboard-stat-card-details">
                                <span class="kecom-account-dashboard-stat-card-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></span>
                                <span class="kecom-account-dashboard-stat-card-value"><?php esc_html_e('Manage', 'kirki-ecommerce'); ?></span>
                                <span class="kecom-account-dashboard-stat-card-subtext"><?php esc_html_e('Billing & Shipping &rarr;', 'kirki-ecommerce'); ?></span>
                            </div>
                        </a>

                        <a href="<?php echo esc_url(Url::get_account_url('details')); ?>" class="kecom-account-dashboard-stat-card">
                            <div class="kecom-account-dashboard-stat-card-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="8" r="5" />
                                    <path d="M20 21a8 8 0 1 0-16 0" />
                                </svg>
                            </div>
                            <div class="kecom-account-dashboard-stat-card-details">
                                <span class="kecom-account-dashboard-stat-card-title"><?php esc_html_e('Account Details', 'kirki-ecommerce'); ?></span>
                                <span class="kecom-account-dashboard-stat-card-value"><?php echo esc_html($user->user_email ?: __('Profile', 'kirki-ecommerce')); ?></span>
                                <span class="kecom-account-dashboard-stat-card-subtext"><?php esc_html_e('Edit profile & password &rarr;', 'kirki-ecommerce'); ?></span>
                            </div>
                        </a>
                    </div>

                    <!-- Recent Orders Snapshot -->
                    <div class="kecom-account-dashboard-recent-orders">
                        <div class="kecom-account-dashboard-recent-orders-header">
                            <h4><?php esc_html_e('Recent Orders', 'kirki-ecommerce'); ?></h4>
                            <?php if ($orders_count > 0) : ?>
                                <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>">
                                    <?php esc_html_e('View All', 'kirki-ecommerce'); ?> &rarr;
                                </a>
                            <?php endif; ?>
                        </div>

                        <?php if (!empty($recent_orders)) : ?>
                            <div class="kecom-account-orders-table-wrap">
                                <table class="kecom-account-orders-table">
                                    <thead>
                                        <tr>
                                            <th><?php esc_html_e('Order', 'kirki-ecommerce'); ?></th>
                                            <th><?php esc_html_e('Date', 'kirki-ecommerce'); ?></th>
                                            <th><?php esc_html_e('Status', 'kirki-ecommerce'); ?></th>
                                            <th><?php esc_html_e('Total', 'kirki-ecommerce'); ?></th>
                                            <th><?php esc_html_e('Action', 'kirki-ecommerce'); ?></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recent_orders as $order) :
                                            $order_status = $order['status'] ?? 'processing';
                                            $status_badge_class = match ($order_status) {
                                                'completed' => 'success-light',
                                                'processing' => 'primary',
                                                'cancelled', 'refunded' => 'error-light',
                                                default => 'default',
                                            };
                                            $order_date = isset($order['created_at']) ? (is_object($order['created_at']) ? date_i18n(get_option('date_format'), $order['created_at']->get_timestamp()) : $order['created_at']) : '—';
                                            $total_display = $order['totals']['invoiced_total_money_object']->display ?? ($order['totals']['invoiced_total'] ?? '—');
                                            $items_count = $order['items_count'] ?? count($order['items'] ?? []);
                                        ?>
                                            <tr>
                                                <td>
                                                    <a href="<?php echo esc_url(Url::get_account_url('orders/' . ($order['order_number'] ?? $order['id']))); ?>" class="kecom-account-orders-number">#<?php echo esc_html($order['order_number'] ?? $order['id']); ?></a>
                                                </td>
                                                <td>
                                                    <span class="kecom-account-orders-date"><?php echo esc_html($order_date); ?></span>
                                                </td>
                                                <td>
                                                    <span class="kecom-badge kecom-badge-<?php echo esc_attr($status_badge_class); ?>">
                                                        <?php echo esc_html(ucfirst($order_status)); ?>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="kecom-account-orders-total"><?php echo esc_html($total_display); ?></span>
                                                    <span class="kecom-account-orders-items-count"><?php printf(esc_html(_n('%d item', '%d items', $items_count, 'kirki-ecommerce')), $items_count); ?></span>
                                                </td>
                                                <td>
                                                    <a href="<?php echo esc_url(Url::get_account_url('orders/' . ($order['order_number'] ?? $order['id']))); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                                                        <?php esc_html_e('View', 'kirki-ecommerce'); ?>
                                                    </a>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else : ?>
                            <div class="kecom-account-orders-empty">
                                <div class="kecom-account-orders-empty-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                        <path d="M3 6h18" />
                                        <path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                </div>
                                <h5 class="kecom-account-orders-empty-title"><?php esc_html_e('No orders placed yet', 'kirki-ecommerce'); ?></h5>
                                <p class="kecom-account-orders-empty-text"><?php esc_html_e('Explore our products and start shopping to view your orders here.', 'kirki-ecommerce'); ?></p>
                                <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-sm">
                                    <?php esc_html_e('Start Shopping', 'kirki-ecommerce'); ?>
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
