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

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$data = (object) view_data();
$countries = $data->countries ?? [];
$payment_gateways = $data->payment_gateways ?? [];

$cart = $data->cart ?? null;
$shipping_address = $cart["shipping_address"] ?? [];
$billing_address = $cart["billing_address"] ?? [];
$available_shipping_methods = $cart["available_shipping_methods"] ?? [];
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper" x-data="checkout()">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <?php include_view('site.checkout.parts.shipping-form', compact('countries', 'shipping_address')); ?>
                <?php include_view('site.checkout.parts.billing-form', compact('countries', 'billing_address')); ?>
                <?php include_view('site.checkout.parts.shipping-methods'); ?>
                <?php include_view('site.checkout.parts.payment-methods', compact('payment_gateways')); ?>
            </div>

            <!-- Right Column -->
            <div class="kecom-checkout-right">
                <?php include_view('site.checkout.parts.order-products', compact('cart')); ?>
                <?php include_view('site.checkout.parts.coupon-form'); ?>
                <?php include_view('site.checkout.parts.order-summary', compact('cart')); ?>

                <!-- Pay Button -->
                <button type="button" class="kecom-btn kecom-btn-primary kecom-btn-lg kecom-pay-btn" :class="{ 'kecom-btn-loading': loading }" :disabled="loading" @click="placeOrder">
                    <?php esc_html_e('Place Order', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>