<?php

/**
 * Account Orders Page Template.
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

$orders = view_data('orders') ?: [];
$orders_count = count($orders);
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'orders']); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-account-orders">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title"><?php esc_html_e('Your Orders', 'kirki-ecommerce'); ?></h3>
                        <div class="kecom-account-panel-header-action">
                            <span class="kecom-badge kecom-badge-default"><?php printf(esc_html(_n('%d Order', '%d Orders', $orders_count, 'kirki-ecommerce')), $orders_count); ?></span>
                        </div>
                    </div>

                    <?php if (!empty($orders)) : ?>
                        <div class="kecom-account-orders-table-wrap">
                            <table class="kecom-account-orders-table">
                                <thead>
                                    <tr>
                                        <th><?php esc_html_e('Order Number', 'kirki-ecommerce'); ?></th>
                                        <th><?php esc_html_e('Date', 'kirki-ecommerce'); ?></th>
                                        <th><?php esc_html_e('Status', 'kirki-ecommerce'); ?></th>
                                        <th><?php esc_html_e('Total', 'kirki-ecommerce'); ?></th>
                                        <th><?php esc_html_e('Items', 'kirki-ecommerce'); ?></th>
                                        <th><?php esc_html_e('Action', 'kirki-ecommerce'); ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($orders as $order) :
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
                                                <a href="<?php echo esc_url(Url::get_account_order_details_url($order['order_number'] ?? $order['id'])); ?>" class="kecom-account-orders-number">#<?php echo esc_html($order['order_number'] ?? $order['id']); ?></a>
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
                                            </td>
                                            <td>
                                                <span class="kecom-account-orders-items-count"><?php printf(esc_html(_n('%d item', '%d items', $items_count, 'kirki-ecommerce')), $items_count); ?></span>
                                            </td>
                                            <td>
                                                <a href="<?php echo esc_url(Url::get_account_order_details_url($order['order_number'] ?? $order['id'])); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                                                    <?php esc_html_e('View Order', 'kirki-ecommerce'); ?>
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
                                    <path d="m7.5 4.27 9 5.15" />
                                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                    <path d="m3.3 7 8.7 5 8.7-5" />
                                    <path d="M12 22V12" />
                                </svg>
                            </div>
                            <h4 class="kecom-account-orders-empty-title"><?php esc_html_e('No orders found', 'kirki-ecommerce'); ?></h4>
                            <p class="kecom-account-orders-empty-text"><?php esc_html_e('You have not placed any orders yet. Once you make a purchase, it will appear here.', 'kirki-ecommerce'); ?></p>
                            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
                                <?php esc_html_e('Start Shopping', 'kirki-ecommerce'); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
