<?php

/**
 * Account Order Details Page Template.
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

$order = view_data('order') ?: [];
$order_model = view_data('order_model') ?: null;
$payment_provider = view_data('payment_provider') ?: '';

if (empty($order)) {
    return;
}

$order_status = $order['status'] ?? 'processing';
$payment_status = $order['payment_status'] ?? ($order_model->payment_status ?? 'pending');
$fulfillment_status = $order['fulfillment_status'] ?? ($order_model->fulfillment_status ?? 'unfulfilled');

$status_badge_class = match ($order_status) {
    'completed' => 'success-light',
    'processing' => 'primary',
    'cancelled', 'refunded' => 'error-light',
    default => 'default',
};

$payment_badge_class = match ($payment_status) {
    'paid' => 'success-light',
    'refunded' => 'error-light',
    default => 'warning',
};

$fulfillment_badge_class = match ($fulfillment_status) {
    'fulfilled', 'delivered' => 'success-light',
    'shipped' => 'primary',
    default => 'default',
};

$order_date = !empty($order_model?->created_at) ? date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $order_model->created_at->get_timestamp()) : '—';
$totals = $order['totals'] ?? [];
$items = $order['items'] ?? [];
$order_number = $order['order_number'] ?? ($order_model->order_number ?? $order['id']);
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
                <div class="kecom-order-details">
                    <!-- Back Link -->
                    <div>
                        <a href="<?php echo esc_url(Url::get_account_orders_url()); ?>" class="kecom-order-details-back">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span><?php esc_html_e('Back to all orders', 'kirki-ecommerce'); ?></span>
                        </a>
                    </div>

                    <!-- Order Header -->
                    <div class="kecom-order-details-header">
                        <div class="kecom-order-details-header-info">
                            <h2 class="kecom-order-details-header-info-title">
                                <?php printf(esc_html__('Order #%s', 'kirki-ecommerce'), esc_html($order_number)); ?>
                            </h2>
                            <p class="kecom-order-details-header-info-date">
                                <?php printf(esc_html__('Placed on %s', 'kirki-ecommerce'), esc_html($order_date)); ?>
                            </p>
                        </div>
                        <div class="kecom-order-details-header-badges">
                            <span class="kecom-badge kecom-badge-<?php echo esc_attr($status_badge_class); ?>">
                                <?php printf(esc_html__('Status: %s', 'kirki-ecommerce'), esc_html(ucfirst($order_status))); ?>
                            </span>
                            <span class="kecom-badge kecom-badge-<?php echo esc_attr($payment_badge_class); ?>">
                                <?php printf(esc_html__('Payment: %s', 'kirki-ecommerce'), esc_html(ucfirst($payment_status))); ?>
                            </span>
                            <span class="kecom-badge kecom-badge-<?php echo esc_attr($fulfillment_badge_class); ?>">
                                <?php printf(esc_html__('Fulfillment: %s', 'kirki-ecommerce'), esc_html(ucfirst($fulfillment_status))); ?>
                            </span>
                        </div>
                    </div>

                    <!-- Tracking Box (if tracking available) -->
                    <?php if (!empty($order_model?->shipping_tracking_number)) : ?>
                        <div class="kecom-order-details-tracking-box">
                            <div class="kecom-order-details-tracking-box-info">
                                <h5><?php esc_html_e('Shipment Tracking', 'kirki-ecommerce'); ?></h5>
                                <p>
                                    <?php if (!empty($order_model->shipping_carrier)) : ?>
                                        <strong><?php echo esc_html($order_model->shipping_carrier); ?>:</strong>
                                    <?php endif; ?>
                                    <?php echo esc_html($order_model->shipping_tracking_number); ?>
                                </p>
                            </div>
                            <?php if (!empty($order_model->shipping_tracking_url)) : ?>
                                <a href="<?php echo esc_url($order_model->shipping_tracking_url); ?>" target="_blank" rel="noopener noreferrer" class="kecom-btn kecom-btn-primary kecom-btn-sm">
                                    <?php esc_html_e('Track Shipment', 'kirki-ecommerce'); ?> &rarr;
                                </a>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <!-- Order Items Table -->
                    <div class="kecom-order-details-items-card">
                        <table class="kecom-order-details-table">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e('Product', 'kirki-ecommerce'); ?></th>
                                    <th><?php esc_html_e('Price', 'kirki-ecommerce'); ?></th>
                                    <th><?php esc_html_e('Quantity', 'kirki-ecommerce'); ?></th>
                                    <th><?php esc_html_e('Total', 'kirki-ecommerce'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($items as $item) :
                                    $item_name = $item['product_name'] ?? '';
                                    $variant_name = $item['variant_name'] ?? '';
                                    $unit_price = $item['invoiced_price_money_object']->display ?? ($item['invoiced_price'] ?? '—');
                                    $total_price = $item['invoiced_total_money_object']->display ?? ($item['invoiced_total'] ?? '—');
                                    $qty = $item['quantity'] ?? 1;
                                ?>
                                    <tr>
                                        <td>
                                            <div class="kecom-order-details-table-product">
                                                <span class="kecom-order-details-table-product-name"><?php echo esc_html($item_name); ?></span>
                                                <?php if (!empty($variant_name)) : ?>
                                                    <span class="kecom-order-details-table-product-variant"><?php echo esc_html($variant_name); ?></span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="kecom-order-details-table-price"><?php echo esc_html($unit_price); ?></span>
                                        </td>
                                        <td>
                                            <span class="kecom-order-details-table-qty">&times; <?php echo esc_html($qty); ?></span>
                                        </td>
                                        <td>
                                            <span class="kecom-order-details-table-total"><?php echo esc_html($total_price); ?></span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Two-column Summary & Addresses Grid -->
                    <div class="kecom-order-details-grid">
                        <!-- Order Summary Card -->
                        <div class="kecom-order-details-card">
                            <h4 class="kecom-order-details-card-title"><?php esc_html_e('Order Summary', 'kirki-ecommerce'); ?></h4>
                            <div class="kecom-order-details-card-rows">
                                <div class="kecom-order-details-card-row">
                                    <span><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                                    <span class="kecom-order-details-card-row-value"><?php echo esc_html($totals['invoiced_subtotal_money_object']->display ?? '—'); ?></span>
                                </div>

                                <?php if (!empty($totals['invoiced_discount_money_object']) && $totals['invoiced_discount_money_object']->raw > 0) : ?>
                                    <div class="kecom-order-details-card-row">
                                        <span><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-order-details-card-row-value" style="color: var(--kecom-color-critical);">-<?php echo esc_html($totals['invoiced_discount_money_object']->display); ?></span>
                                    </div>
                                <?php endif; ?>

                                <?php if (!empty($totals['invoiced_shipping_money_object']) && $totals['invoiced_shipping_money_object']->raw > 0) : ?>
                                    <div class="kecom-order-details-card-row">
                                        <span>
                                            <?php esc_html_e('Shipping', 'kirki-ecommerce'); ?>
                                            <?php if (!empty($order_model?->shipping_method)) : ?>
                                                <small>(<?php echo esc_html($order_model->shipping_method); ?>)</small>
                                            <?php endif; ?>
                                        </span>
                                        <span class="kecom-order-details-card-row-value"><?php echo esc_html($totals['invoiced_shipping_money_object']->display); ?></span>
                                    </div>
                                <?php endif; ?>

                                <?php if (!empty($totals['invoiced_tax_money_object']) && $totals['invoiced_tax_money_object']->raw > 0) : ?>
                                    <div class="kecom-order-details-card-row">
                                        <span><?php esc_html_e('Tax', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-order-details-card-row-value"><?php echo esc_html($totals['invoiced_tax_money_object']->display); ?></span>
                                    </div>
                                <?php endif; ?>

                                <div class="kecom-order-details-card-row is-total">
                                    <span><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                                    <span class="kecom-order-details-card-row-value"><?php echo esc_html($totals['invoiced_total_money_object']->display ?? '—'); ?></span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment & Shipping Details Card -->
                        <div class="kecom-order-details-card">
                            <h4 class="kecom-order-details-card-title"><?php esc_html_e('Payment & Delivery', 'kirki-ecommerce'); ?></h4>
                            <div class="kecom-order-details-card-rows">
                                <?php if (!empty($payment_provider)) : ?>
                                    <div class="kecom-order-details-card-row">
                                        <span><?php esc_html_e('Payment Method', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-order-details-card-row-value"><?php echo esc_html($payment_provider); ?></span>
                                    </div>
                                <?php endif; ?>

                                <!-- Shipping Address -->
                                <?php if (!empty($order_model?->shipping_address_line1) || !empty($order_model?->shipping_first_name)) : ?>
                                    <div>
                                        <span style="font-weight: 600; color: var(--kecom-text-primary); font-size: 0.875rem; display: block; margin-bottom: 4px;"><?php esc_html_e('Shipping Address', 'kirki-ecommerce'); ?></span>
                                        <address>
                                            <strong><?php echo esc_html(trim(($order_model->shipping_first_name ?? '') . ' ' . ($order_model->shipping_last_name ?? ''))); ?></strong>
                                            <?php if (!empty($order_model->shipping_company)) : ?>
                                                <?php echo esc_html($order_model->shipping_company); ?><br />
                                            <?php endif; ?>
                                            <?php echo esc_html($order_model->shipping_address_line1 ?? ''); ?><br />
                                            <?php if (!empty($order_model->shipping_address_line2)) : ?>
                                                <?php echo esc_html($order_model->shipping_address_line2); ?><br />
                                            <?php endif; ?>
                                            <?php echo esc_html(($order_model->shipping_city ?? '') . ', ' . ($order_model->shipping_state ?? '') . ' ' . ($order_model->shipping_postal_code ?? '')); ?><br />
                                            <?php echo esc_html($order_model->shipping_country ?? ''); ?>
                                        </address>
                                    </div>
                                <?php endif; ?>

                                <!-- Billing Address -->
                                <?php if (!empty($order_model?->billing_address_line1) || !empty($order_model?->billing_first_name)) : ?>
                                    <div style="margin-top: 8px;">
                                        <span style="font-weight: 600; color: var(--kecom-text-primary); font-size: 0.875rem; display: block; margin-bottom: 4px;"><?php esc_html_e('Billing Address', 'kirki-ecommerce'); ?></span>
                                        <address>
                                            <strong><?php echo esc_html(trim(($order_model->billing_first_name ?? '') . ' ' . ($order_model->billing_last_name ?? ''))); ?></strong>
                                            <?php if (!empty($order_model->billing_company)) : ?>
                                                <?php echo esc_html($order_model->billing_company); ?><br />
                                            <?php endif; ?>
                                            <?php echo esc_html($order_model->billing_address_line1 ?? ''); ?><br />
                                            <?php if (!empty($order_model->billing_address_line2)) : ?>
                                                <?php echo esc_html($order_model->billing_address_line2); ?><br />
                                            <?php endif; ?>
                                            <?php echo esc_html(($order_model->billing_city ?? '') . ', ' . ($order_model->billing_state ?? '') . ' ' . ($order_model->billing_postal_code ?? '')); ?><br />
                                            <?php echo esc_html($order_model->billing_country ?? ''); ?>
                                        </address>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
