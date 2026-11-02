<?php

/**
 * Checkout Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;

use function Kirki\Ecommerce\App\settings;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$data = (object) view_data();
$countries = $data->countries ?? [];
$payment_gateways = $data->payment_gateways ?? [];

$cart = $data->cart ?? null;
$shipping_address = $cart["shipping_address"] ?? [];
$billing_address = $cart["billing_address"] ?? [];
$available_shipping_methods = $cart["available_shipping_methods"] ?? [];
$show_customer_note = (bool) settings('checkout.checkout_configuration.show_customer_note');
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper" x-data="checkout()">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <?php include_view('site.checkout.parts.contact-info'); ?>
                <?php include_view('site.checkout.parts.shipping-form', compact('countries', 'shipping_address')); ?>
                <?php include_view('site.checkout.parts.billing-form', compact('countries', 'billing_address')); ?>
                <?php include_view('site.checkout.parts.shipping-methods'); ?>
                <?php include_view('site.checkout.parts.payment-methods', compact('payment_gateways')); ?>

                <?php if ($show_customer_note) : ?>
                    <div class="kecom-order-note-section">
                        <div class="kecom-field">
                            <label class="kecom-field-label" for="checkout-order-notes"><?php esc_html_e('Leave a Note (Optional)', 'kirki-ecommerce'); ?></label>
                            <textarea
                                class="kecom-textarea"
                                id="checkout-order-notes"
                                name="order_notes"
                                placeholder="<?php esc_attr_e('e.g., Leave at front door, call before delivery, or special handling instructions', 'kirki-ecommerce'); ?>"
                                x-model="orderNotes"></textarea>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Right Column -->
            <div class="kecom-checkout-right">
                <?php include_view('site.checkout.parts.order-products', compact('cart')); ?>
                <?php include_view('site.checkout.parts.coupon-form'); ?>
                <?php include_view('site.checkout.parts.order-summary', compact('cart')); ?>

                <?php include_view('site.checkout.parts.consents', ['consents' => $data->consents ?? []]); ?>

                <!-- Pay Button -->
                <button type="button" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-pay-btn" :class="{ 'kecom-btn-loading': loading }" :disabled="loading" @click="placeOrder">
                    <?php esc_html_e('Place Order', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </div>
    </div>

    <!-- Address Picker Modal -->
    <?php include_view('site.checkout.parts.address-picker-modal'); ?>

    <!-- Add/Edit Address Modal -->
    <?php include_view('site.account.parts.address-modal'); ?>
</div>

<?php Template::get_footer(); ?>