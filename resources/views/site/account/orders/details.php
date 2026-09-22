<?php

/**
 * Account Orders - Details Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Icon;

use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

$fallback_image_url = Url::get_product_fallback_image();
$order = $data['order'];
$customer = $order['customer'] ?? [];

$first_name = ucfirst($customer['first_name'] ?? '');
$last_name = ucfirst($customer['last_name'] ?? '');
$email = $customer['email'] ?? '';

$pricing = isset($order['pricing']) ? $order['pricing'] : null;
$subtotal = $pricing['invoiced_items_subtotal_money_object'] ?? null;
$discount = $pricing['invoiced_order_discount_money_object'] ?? null;
$order_total = $pricing['invoiced_order_total_money_object'] ?? null;
$coupons = $pricing['coupons'] ?? [];
$shipping = $pricing['invoiced_shipping_amount_money_object'] ?? null;
$total = $pricing['invoiced_total_money_object'] ?? null;
$tax_lines = $pricing['tax_lines'] ?? [];
$tax_total = $pricing['invoiced_tax_total_money_object'] ?? null;
$is_tax_inclusive = Settings::get('tax.is_tax_inclusive_price');


$order_activities = $data['activities'] ?? [];

$items = isset($order['items']) ? $order['items']: [];
$items_product_data = $order['item_product_data'] ?? [];
$order_placed = isset($order['created_at']) ? $order['created_at'] : '';
$shipping_address = $order['shipping_address'] ?? [];
$shipping_country = $order['shipping_country'] ?? [];
$shipping_state = array_find($shipping_country['states'] ?? [], fn($item) => $item['id'] == $shipping_address['state']);
$billing_country = $order['billing_country'] ?? [];
$billing_address = $order['billing_address'] ?? [];
$billing_state = array_find($billing_country['states'] ?? [], fn($item) => $item['id'] == $billing_address['state']);

?>

<div class="kecom-order-details-page">
    <!-- Top Navigation & Order Title Bar -->
    <div class="kecom-order-details-header">
        <div class="kecom-order-details-header-left">
            <?php if (isset($data['show_back_to_orders']) && $data['show_back_to_orders']) : ?>
                <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>" class="kecom-btn kecom-btn-outline kecom-btn-icon kecom-btn-sm" aria-label="<?php esc_attr_e('Back to orders', 'kirki-ecommerce'); ?>">
                    <?php Icon::render('arrow-left'); ?>
                </a>
            <?php endif; ?>
            <div class="kecom-order-details-title-wrap">
                <div class="kecom-order-details-heading-row">
                    <?php /* translators: %s: order number */ ?>
                    <h1 class="kecom-order-details-title"><?php printf(esc_html__('Order #%s', 'kirki-ecommerce'), esc_html($order['order_number'] ?? '')); ?></h1>
                </div>
                <div class="kecom-order-details-placed">
                    <?php esc_html_e('Placed on ', 'kirki-ecommerce'); ?>
                    <span x-data x-local-time="'<?php echo esc_js($order_placed); ?>'"></span>
                </div>
            </div>
        </div>
    </div>

    <!-- 2-Column Content Grid -->
    <div class="kecom-order-details-grid">
        <!-- Left Column (Status Stepper + Address Info) -->
        <div class="kecom-order-details-col-left">
            <!-- Card 1: Order Status Timeline -->
            <div class="kecom-order-status-card">
                <h3 class="kecom-card-title"><?php esc_html_e('Order Activities', 'kirki-ecommerce'); ?></h3>
                <div class="kecom-order-stepper">
                    <?php if (count($order_activities)) :?>
                        <?php foreach ($order_activities as $key => $timeline) : ?>
                                <div class="kecom-order-step <?php echo 0 === $key ? 'kecom-order-step-active' : '' ?> <?php
                                    echo $timeline['activity_type'] === OrderActivityType::DELIVERED ? 'kecom-order-step-delivered' : '' ?> <?php
                                        echo $timeline['activity_type'] === OrderActivityType::CANCELLED ? 'kecom-order-step-cancelled' : '' ?>">
                                    <div class="kecom-order-step-indicator">
                                        <?php if ($timeline['activity_type'] === OrderActivityType::DELIVERED) : ?>
                                                <?php Icon::render('check'); ?>
                                        <?php elseif ($timeline['activity_type'] === OrderActivityType::CANCELLED) : ?>
                                            <?php Icon::render('cross'); ?>
                                        <?php else : ?>
                                            <span class="kecom-order-step-dot"></span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="kecom-order-step-content">
                                        <h4 class="kecom-order-step-title"><?php echo esc_html(OrderActivityType::get_formatted($timeline['activity_type']) ?? ''); ?></h4>
                                        <span class="kecom-order-step-date" x-data x-local-time="'<?php echo esc_js($timeline['created_at']); ?>'"></span>
                                    </div>
                                </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Card 2: Contact, Payment & Address Information (2x2 Grid) -->
            <div class="kecom-card kecom-order-info-card">
                <div class="kecom-order-info-grid">
                    <!-- Contact Information -->
                    <div class="kecom-order-info-block">
                        <h4 class="kecom-order-info-title">
                            <?php esc_html_e('Contact Information', 'kirki-ecommerce'); ?>
                        </h4>
                        <div class="kecom-order-info-content">
                            <?php if (empty($customer) || !$customer['id']) : ?>
                                <p class="kecom-order-info-text"><?php esc_html_e('N/A', 'kirki-ecommerce') ?></p>
                            <?php else : ?>
                                <p class="kecom-order-info-text"><?php echo esc_html($first_name . ' ' . $last_name) ?></p>
                                <p class="kecom-order-info-text"><?php echo esc_html($email); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Payment Information -->
                    <div class="kecom-order-info-block">
                        <h4 class="kecom-order-info-title">
                            <?php esc_html_e('Payment', 'kirki-ecommerce'); ?>
                            <span class="kecom-badge <?php echo esc_attr(Utils::get_status_badge_class($order['payment_status'])); ?>">
                                <?php echo esc_html(PaymentStatus::get_formatted($order['payment_status'])); ?>
                            </span>
                        </h4>
                        <div class="kecom-order-info-content">
                            <p class="kecom-order-info-text"><?php echo esc_html(ucfirst($order['payment_provider_name'] ?? $order['payment_provider'])); ?></p>
                        </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="kecom-order-info-block">
                        <h4 class="kecom-order-info-title">
                            <?php esc_html_e('Shipping Address', 'kirki-ecommerce'); ?>
                        </h4>
                        <div class="kecom-order-address-lines">
                            <?php if (!empty($shipping_address['address_line1'])) : ?>
                                <p><?php echo esc_html($shipping_address['address_line1']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($shipping_address['address_line2'])) : ?>
                                <p><?php echo esc_html($shipping_address['address_line2']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($shipping_address['city'])) : ?>
                                <p><?php echo esc_html($shipping_address['city']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($shipping_state['name']) && !empty($shipping_address['postal_code'])) : ?>
                                <p><?php echo esc_html($shipping_state['name'] . ', ' . $shipping_address['postal_code']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($shipping_country['name'])) : ?>
                                <p><?php echo esc_html($shipping_country['name']); ?></p>
                            <?php endif ?>
                        </div>
                    </div>

                    <!-- Billing Address -->
                    <div class="kecom-order-info-block">
                        <h4 class="kecom-order-info-title">
                            <?php esc_html_e('Billing Address', 'kirki-ecommerce'); ?>
                        </h4>
                        <div class="kecom-order-address-lines">
                            <?php if (!empty($billing_address['address_line1'])) : ?>
                                <p><?php echo esc_html($billing_address['address_line1']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($billing_address['address_line2'])) : ?>
                                <p><?php echo esc_html($billing_address['address_line2']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($billing_address['city'])) : ?>
                                <p><?php echo esc_html($billing_address['city']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($billing_state['name']) && !empty($billing_address['postal_code'])) : ?>
                                <p><?php echo esc_html($billing_state['name'] . ', ' . $billing_address['postal_code']); ?></p>
                            <?php endif ?>

                            <?php if (!empty($billing_country['name'])) : ?>
                                <p><?php echo esc_html($billing_country['name']); ?></p>
                            <?php endif ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column (Products List & Total Breakdown) -->
        <div class="kecom-order-details-col-right">
            <div class="kecom-order-summary-card" x-data="{ expanded: false, isAtBottom: false }" :class="expanded ? 'expanded' : ''">
                <!-- Order Items List -->
                <div class="kecom-product-list-wrapper" x-ref="list_wrapper" :class="expanded ? 'scrollable': ''" @scroll="isAtBottom = $el.scrollHeight - $el.scrollTop <= $el.clientHeight + 1">
                    <div class="kecom-product-list">
                            <?php foreach ($items as $key => $item) :
                                $inv_price_obj = $item['invoiced_subtotal_money_object'] ?? null;
                                $inv_strikethrough_price_obj = $item['invoiced_strikethrough_price_money_object'] ?? null;
                                $item_product = $items_product_data[$key]['product'] ?? [];
                                $product_image = $item_product['media'][0] ?? [];
                                $product_first_image = MediaAttachment::make($product_image['ID'] ?? 0);
                                $image = $item['image'] ? $item['image'] : $product_first_image;
                                $applied_coupons = $item['applied_product_coupons'] ?? [];
                                ?>
                            <div class="kecom-product-item">
                                <div class="kecom-product-image-wrapper">
                                    <?php if (!empty($image) && isset($image['url'])) : ?>
                                        <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($item['product_name']); ?>" class="kecom-product-image">
                                    <?php else : ?>
                                        <img src="<?php echo esc_url($fallback_image_url); ?>" alt="<?php echo esc_attr($item['product_name']); ?>" class="kecom-product-image">
                                    <?php endif; ?>
                                    <span class="kecom-product-qty-badge"><?php echo esc_html($item['quantity'] ?? 0); ?></span>
                                </div>

                                <div class="kecom-product-info">
                                    <a href="<?php echo esc_url(Url::get_product_url($item_product['slug'] ?? '')); ?>" class="kecom-product-name"><?php echo esc_html($item['product_name'] ?? ''); ?></a>
                                    <div class="kecom-product-variant">
                                        <?php echo esc_html($item['variant_name'] ?? '') ?>
                                    </div>
                                    <?php if (!empty($applied_coupons)): ?>
                                        <?php foreach ($applied_coupons as $coupon): 
                                            $code = $coupon['code'] ?? '';
                                            $discount_type = $coupon['discount_value_type'] ?? '';
                                            $discount_amount = $coupon['discount_amount_percentage'] ?? '';
                                            $amount = $coupon['invoiced_discount_amount_money_object'] ?? '';
                                            $coupon_text = sprintf(__( '%s %s (-%s) Discount Applied', 'kirki-ecommerce'), $code, 'percentage' === $discount_type ? $discount_amount . '%' : '', $amount->display);
                                            ?>
                                            <div class="kecom-product-coupon">
                                                <span class="kecom-product-coupon-icon"><?php Icon::render('tag'); ?></span>
                                                <span class="kecom-product-coupon-text"><?php echo esc_html($coupon_text); ?></span>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>

                                <div class="kecom-product-price-wrapper">
                                    <span class="kecom-product-price"><?php echo esc_html($inv_price_obj->display ?? ''); ?></span>
                                    <?php if (!empty($inv_strikethrough_price_obj)): ?>
                                        <span class="kecom-product-discount"><?php echo esc_html($inv_strikethrough_price_obj->display ?? ''); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="kecom-collapse-button" x-show="expanded" x-cloak>
                        <button @click="expanded = !expanded; $refs.list_wrapper.scrollTop = 0;" class="kecom-btn kecom-btn-link"><?php esc_html_e('Show Less', 'kirki-ecommerce'); ?></button>
                    </div>
                </div>
                <?php if (count($items) > 3) : ?>
                    <div class="kecom-expand-button" :class="expanded ? 'expanded' : ''">
                        <?php /* translators: %d: number of additional items */ ?>
                        <button @click="expanded = !expanded" class="kecom-btn kecom-btn-link" x-text="'<?php echo esc_js(sprintf(__('Show More (%d)', 'kirki-ecommerce'), count($items) - 3)); ?>'"></button>
                    </div>
                <?php endif; ?>
                <!-- Summary Totals Breakdown -->
                <div class="kecom-order-pricing-breakdown" :class="expanded && !isAtBottom ? 'expanded' : ''">
                    <?php if ( ! empty( $coupons ) ): ?>
                        <div class="kecom-applied-coupons">
                        <?php foreach( $coupons as $coupon ): ?>
                            <div class="kecom-tag">
                                <span class="kecom-tag-icon"><?php Icon::render('tag'); ?></span>
                                <span class="kecom-tag-text"><?php echo esc_html($coupon['code'] ?? ''); ?></span>
                            </div>
                        <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                    <div class="kecom-pricing-row">
                        <span class="kecom-pricing-label"><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                        <span class="kecom-pricing-value"><?php echo esc_html($subtotal->display ?? ''); ?></span>
                    </div>
                    <?php if ( $discount->raw > 0 ): ?>
                        <div class="kecom-pricing-row kecom-discount-pricing-row">
                            <span class="kecom-pricing-label"><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                            <span class="kecom-pricing-value"><?php echo '-' . esc_html($discount->display ?? ''); ?></span>
                        </div>

                        <div class="kecom-pricing-row">
                            <span class="kecom-pricing-label"><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                            <span class="kecom-pricing-value"><?php echo esc_html($order_total->display ?? ''); ?></span>
                        </div>
                    <?php endif ?>

                    <div class="kecom-pricing-row">
                        <span class="kecom-pricing-label">
                            <?php esc_html_e('Shipping', 'kirki-ecommerce'); ?>
                        </span>
                        <span class="kecom-pricing-value"><?php echo esc_html($shipping->display ?? ''); ?></span>
                    </div>

                    <?php if ( ! empty( $tax_lines ) && ! $is_tax_inclusive ): ?>
                        <?php foreach( $tax_lines as $tax ): ?>
                            <div class="kecom-pricing-row">
                                <span class="kecom-pricing-label">
                                    <?php echo esc_html($tax['name'] ?? ''); ?>
                                 </span>
                                <span class="kecom-pricing-value">
                                    <?php echo esc_html($tax['invoiced_amount_money_object']->display ?? ''); ?>
                                </span>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>

                    <div class="kecom-pricing-row kecom-pricing-row-total">
                        <div class="kecom-total-label-wrapper">
                            <span class="kecom-pricing-label"><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                            <?php if ( ! empty( $tax_lines ) && $is_tax_inclusive ): 
                                $label = 'VAT' === $tax_lines[0]['name'] ? sprintf(__('Incl. %s VAT', 'kirki-ecommerce'), $tax_total->display ?? '') : sprintf(_n('Incl. %s Tax', 'Incl. %s Taxes', count( $tax_lines ), 'kirki-ecommerce'), $tax_total->display ?? '');
                                ?>
                                <div class="kecom-inclusive-tax-wrapper">
                                    <span class="kecom-inclusive-tax-summary"><?php echo esc_html( $label ); ?></span>
                                    <div class="kecom-inclusive-tax-lines">
                                        <?php foreach( $tax_lines as $tax ):  ?>
                                            <div class="kecom-inclusive-tax-line"><?php printf( '%d%% %s: %s', esc_html($tax['rate'] ?? ''), esc_html($tax['name'] ?? ''),  esc_html($tax['invoiced_amount_money_object']->display ?? '') ) ?></div>
                                        <?php endforeach ?>
                                    </div>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div>
                            <span class="kecom-total-currency"><?php echo esc_html($order['currency_code'] ?? ''); ?></span>
                            <span class="kecom-pricing-value"><?php echo esc_html($total->display ?? ''); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>