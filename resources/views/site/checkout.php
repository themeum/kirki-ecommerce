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

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$data = (object) view_data();
$countries = $data->countries ?? [];
$payment_gateways = $data->payment_gateways ?? [];
$customer = $data->customer;
$cart = $data->cart ?? null;
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper" x-data="checkout()">
    <div class="kecom-checkout-page">
        <div class="kecom-checkout-grid">
            <!-- Left Column -->
            <div class="kecom-checkout-left">
                <?php include_view('site.checkout.parts.shipping-form', compact('countries', 'customer')); ?>
                <?php include_view('site.checkout.parts.billing-form', compact('countries', 'customer')); ?>
                <?php include_view('site.checkout.parts.payment-methods', compact('payment_gateways')); ?>
            </div>

            <!-- Right Column -->
            <div class="kecom-checkout-right">
                <?php include_view('site.checkout.parts.order-products', compact('cart')); ?>
                <?php include_view('site.checkout.parts.coupon-form'); ?>
                <?php include_view('site.checkout.parts.order-summary', compact('cart')); ?>
                <?php include_view('site.checkout.parts.place-order-button'); ?>
            </div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>