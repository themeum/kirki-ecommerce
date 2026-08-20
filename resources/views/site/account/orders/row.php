<?php

/**
 * Account Orders List Partial.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

$order = $data['order'] ?? [];
if (empty($order)) {
    return;
}

$order_uuid = $order['uuid'] ?? '';
$order_number = $order['order_number'] ?? '';
$fulfillment_status = $order['fulfillment_status'] ?? '';
$fullfillment_status_desc = $order['fulfillment_status_desc'] ?? '';
$order_url = Url::get_account_url('orders/' . $order_uuid);
$invoiced_total = $order['invoiced_total_money_object']->display ?? '';
$order_items = $order['quantity'] ?? 0;
$items_images = $order['items_images'] ?? [];

?>
<tr>
    <!-- 1. Product Image / Collage Placeholder -->
    <td class="kecom-orders-table-col-thumb">
        <div class="kecom-account-order-thumb-wrap">
            <div class="kecom-account-order-thumb kecom-thumb-placeholder">
                <?php if (!empty($items_images)) : ?>
                    <img src="<?php echo esc_url($items_images[0]); ?>" alt="<?php esc_attr_e('Product image', 'kirki-ecommerce'); ?>">
                <?php endif; ?>
            </div>
        </div>
    </td>

    <!-- 2. Order ID & Item Count -->
    <td class="kecom-orders-table-col-info">
        <div class="kecom-account-order-info">
            <a href="<?php echo esc_url($order_url); ?>" class="kecom-account-order-number">
                #<?php echo esc_html($order_number); ?>
            </a>
            <span class="kecom-account-order-items">
                <?php printf(esc_html(_n('%d item', '%d items', $order_items, 'kirki-ecommerce')), $order_items); ?>
            </span>
        </div>
    </td>

    <!-- 3. Status & Delivery/Payment Helper -->
    <td class="kecom-orders-table-col-status">
        <div class="kecom-account-order-status-block">
            <span class="kecom-account-order-status-title">
                <?php echo esc_html(ucfirst($fulfillment_status)); ?>
            </span>
            <span class="kecom-account-order-status-sub">
                <?php echo esc_html($fullfillment_status_desc); ?>
            </span>
        </div>
    </td>

    <!-- 4. Price -->
    <td class="kecom-orders-table-col-price">
        <div class="kecom-account-order-price-block">
            <span class="kecom-account-order-price"><?php echo esc_html($invoiced_total); ?></span>
        </div>
    </td>

    <!-- 5. Action Buttons (Pay, View) -->
    <td class="kecom-orders-table-col-actions">
        <div class="kecom-account-order-actions-wrap">
            <?php
            //TODO: later will be added.
            if (false) :
                ?>
                <a href="<?php echo esc_url(Url::get_checkout_url() . '?order_pay=' . $order['order_number']); ?>" class="kecom-btn kecom-btn-secondary kecom-btn-sm">
                <?php esc_html_e('Pay', 'kirki-ecommerce'); ?>
                </a>
            <?php endif; ?>
            <a href="<?php echo esc_url($order_url); ?>" class="kecom-btn kecom-btn-outline kecom-btn-sm">
                <?php esc_html_e('View', 'kirki-ecommerce'); ?>
            </a>
        </div>
    </td>
</tr>