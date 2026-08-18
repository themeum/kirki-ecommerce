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

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;

$orders = $data['orders'] ?? [];
if (empty($orders)) {
    return;
}

$image_url = Assets::get_url('images/product-fallback.webp');
?>

<div class="kecom-table-wrap">
    <table class="kecom-table kecom-table-spaced kecom-orders-table">
        <tbody>
            <?php foreach ($orders as $order) :
                $order_uuid = $order['uuid'];
                $order_number = $order['order_number'];
                $order_status = $order['status'];
                $order_url = Url::get_account_url('orders/' . $order_uuid);
                $invoiced_total = $order['invoiced_total_money_object']->display ?? ''
                ?>
                <tr>
                    <!-- 1. Product Image / Collage Placeholder -->
                    <td class="kecom-orders-table-col-thumb">
                        <div class="kecom-account-order-thumb-wrap">
                            <div class="kecom-account-order-thumb kecom-thumb-placeholder">
                                <img src="<?php echo esc_url($image_url); ?>" alt="">
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
                                <?php printf(esc_html(_n('%d item', '%d items', $order['items_count'], 'kirki-ecommerce')), $order['items_count']); ?>
                            </span>
                        </div>
                    </td>

                    <!-- 3. Status & Delivery/Payment Helper -->
                    <td class="kecom-orders-table-col-status">
                        <div class="kecom-account-order-status-block">
                            <span class="kecom-account-order-status-title">
                                <?php echo esc_html(ucfirst($order_status)); ?>
                            </span>
                            <span class="kecom-account-order-status-sub">
                                <?php echo esc_html($order['status_desc']); ?>
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
                            <?php if (!empty($order['is_unpaid'])) : ?>
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
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
