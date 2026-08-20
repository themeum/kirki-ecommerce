<?php

/**
 * Account - Order Details Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$pages = view_data('pages');
$fallback_image_url = Assets::get_url('images/product-fallback.webp');
$order = view_data('order');
$customer = customer();

$first_name = ucfirst($customer->get_first_name());
$last_name = ucfirst($customer->get_last_name());
$email = $customer->get_email();

$totals = $order['totals'] ?? [];
$subtotal = $totals['invoiced_subtotal_money_object'] ?? null;
$shipping = $totals['invoiced_shipping_money_object'] ?? null;
$taxes = $totals['invoiced_tax_money_object'] ?? null;
$discount = $totals['invoiced_discount_money_object'] ?? null;
$total = $totals['invoiced_total_money_object'] ?? null;

$order_timeline = $order['order_timeline'] ?? [];

usort($order_timeline, fn($a_time, $b_time) => $a_time['date'] <=> $b_time['date']);

$items = $order['items']->to_array() ?? [];
$items_product_data = $order['item_product_data'] ?? [];
$order_placed = isset($order['created_at']) ? date('M j, Y', strtotime($order['created_at'])) : '';
$shipping_address = $order['shipping_address'] ?? [];
$shipping_country = $order['shipping_country'] ?? [];
$shipping_state = array_find($shipping_country['states'] ?? [], fn($item) => $item['id'] == $shipping_address['state']);
$billing_country = $order['billing_country'] ?? [];
$billing_address = $order['billing_address'] ?? [];
$billing_state = array_find($billing_country['states'] ?? [], fn($item) => $item['id'] == $billing_address['state']);
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'orders', 'pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-order-details-page">
                    <!-- Top Navigation & Order Title Bar -->
                    <div class="kecom-order-details-header">
                        <div class="kecom-order-details-header-left">
                            <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>" class="kecom-btn kecom-btn-outline kecom-btn-icon kecom-btn-sm" aria-label="<?php esc_attr_e('Back to orders', 'kirki-ecommerce'); ?>">
                                <?php Icon::render('arrow-left'); ?>
                            </a>
                            <div class="kecom-order-details-title-wrap">
                                <div class="kecom-order-details-heading-row">
                                    <h1 class="kecom-order-details-title"><?php echo printf(__('Order #%s', 'kirki-ecommerce'), $order['order_number'] ?? ''); ?></h1>
                                    <span class="kecom-badge <?php echo Utils::get_status_badge_class($order['fulfillment_status']); ?>">
                                        <?php echo esc_html($order['formatted_status'] ?? '') ?>
                                    </span>
                                    <span class="kecom-badge <?php echo Utils::get_status_badge_class($order['payment_status']); ?>">
                                        <?php echo esc_html($order['payment_status'] === 'paid' ? __('Paid', 'kirki-ecommerce') : __('Unpaid', 'kirki-ecommerce')); ?>
                                    </span>
                                </div>
                                <span class="kecom-order-details-placed"><?php echo esc_html(__('Placed on ', 'kirki-ecommerce') . $order_placed); ?></span>
                            </div>
                        </div>
                    </div>

                    <!-- 2-Column Content Grid -->
                    <div class="kecom-order-details-grid">
                        <!-- Left Column (Status Stepper + Address Info) -->
                        <div class="kecom-order-details-col-left">
                            <!-- Card 1: Order Status Timeline -->
                            <div class="kecom-card kecom-order-status-card">
                                <h3 class="kecom-card-title"><?php esc_html_e('Order Timeline', 'kirki-ecommerce'); ?></h3>

                                <div class="kecom-order-stepper">
                                    <div class="kecom-order-step">
                                        <div class="kecom-order-step-indicator">
                                            <span class="kecom-order-step-dot"></span>
                                        </div>
                                        <div class="kecom-order-step-content">
                                            <h4 class="kecom-order-step-title"><?php esc_html_e('Order Received', 'kirki-ecommerce'); ?></h4>
                                            <span class="kecom-order-step-date"><?php echo esc_html(date('F j, Y', strtotime($order['created_at']))); ?></span>
                                        </div>
                                    </div>

                                    <?php if (count($order_timeline)):
                                    ?>
                                        <?php foreach ($order_timeline as $timeline):

                                        ?>
                                            <?php if ($timeline['date']): ?>
                                                <div class="kecom-order-step">
                                                    <div class="kecom-order-step-indicator">
                                                        <span class="kecom-order-step-dot"></span>
                                                    </div>
                                                    <div class="kecom-order-step-content">
                                                        <h4 class="kecom-order-step-title"><?php echo esc_html($timeline['status'] ?? ''); ?></h4>
                                                        <span class="kecom-order-step-date"><?php echo esc_html(date('F j, Y', strtotime($timeline['date'] ?? ''))); ?></span>
                                                    </div>
                                                </div>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    <?php endif; ?>

                                    <?php if ('processing' === $order['fulfillment_status']) : ?>
                                        <div class="kecom-order-step">
                                            <div class="kecom-order-step-indicator">
                                                <span class="kecom-order-step-dot"></span>
                                            </div>
                                            <div class="kecom-order-step-content">
                                                <h4 class="kecom-order-step-title"><?php esc_html_e('Order Processing', 'kirki-ecommerce'); ?></h4>
                                                <span class="kecom-order-step-date"><?php echo esc_html(date('F j, Y', strtotime($order['updated_at']))); ?></span>
                                            </div>
                                        </div>
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
                                            <p class="kecom-order-info-text"><?php echo esc_html($first_name . ' ' . $last_name) ?></p>
                                            <p class="kecom-order-info-text"><?php echo esc_html($email); ?></p>
                                        </div>
                                    </div>

                                    <!-- Payment Information -->
                                    <div class="kecom-order-info-block">
                                        <h4 class="kecom-order-info-title">
                                            <?php esc_html_e('Payment', 'kirki-ecommerce'); ?>
                                        </h4>
                                        <div class="kecom-order-info-content">
                                            <p class="kecom-order-info-text"><?php echo esc_html($order['payment_provider_name'] ?? ''); ?></p>
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
                            <div class="kecom-card kecom-order-summary-card">
                                <!-- Order Items List -->
                                <?php if (count($items)) : ?>
                                    <div class="kecom-product-list">
                                        <!-- Item 1 -->
                                        <?php foreach ($items as $key => $item):
                                            $base_price_obj = $item['base_price_money_object'] ?? null;
                                            $item_product = $items_product_data[$key]['product'] ?? [];
                                            $categories = $item_product['categories'] ?? [];
                                            $product_image = $item_product['media'][0] ?? [];
                                            $product_first_image = MediaAttachment::make($product_image['ID'] ?? 0);
                                            $image = $item['image'] ? $item['image'] : $product_first_image;
                                        ?>
                                            <div class="kecom-product-item">
                                                <div class="kecom-product-image-wrapper">
                                                    <?php if (!empty($image) && isset($image['url'])): ?>
                                                        <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($item['product_name']); ?>" class="kecom-product-image">
                                                    <?php else: ?>
                                                        <img src="<?php echo esc_url(Assets::get_url('images/product-fallback.webp')); ?>" alt="<?php echo esc_attr($item['product_name']); ?>" class="kecom-product-image">
                                                    <?php endif; ?>
                                                    <span class="kecom-product-qty-badge"><?php echo esc_html($item['quantity'] ?? 0); ?></span>
                                                </div>

                                                <div class="kecom-product-info">
                                                    <a href="<?php echo esc_url(Url::get_product_url($item_product['slug'] ?? '')); ?>" class="kecom-product-name"><?php echo esc_html($item['product_name'] ?? ''); ?></a>
                                                    <span class="kecom-product-category"><?php echo esc_html($categories[count($categories) - 1]['name'] ?? ''); ?></span>
                                                    <div class="kecom-product-variant">
                                                        <?php echo esc_html($item['variant_name'] ?? '') ?>
                                                    </div>
                                                </div>

                                                <div class="kecom-product-price-wrapper">
                                                    <span class="kecom-product-price"><?php echo esc_html($base_price_obj->display ?? ''); ?></span>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endif; ?>

                                <!-- Summary Totals Breakdown -->
                                <div class="kecom-order-pricing-breakdown">
                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value"><?php echo esc_html($subtotal->display ?? ''); ?></span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label">
                                            <?php esc_html_e('Shipping', 'kirki-ecommerce'); ?>
                                        </span>
                                        <span class="kecom-pricing-value"><?php echo esc_html($shipping->display ?? ''); ?></span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label">
                                            <?php esc_html_e('Taxes', 'kirki-ecommerce'); ?>
                                        </span>
                                        <span class="kecom-pricing-value"><?php echo esc_html($taxes->display ?? ''); ?></span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value"><?php echo esc_html($discount->display ?? ''); ?></span>
                                    </div>

                                    <div class="kecom-pricing-row kecom-pricing-row-total">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value"><?php echo esc_html($total->display ?? ''); ?></span>
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