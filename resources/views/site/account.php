<?php

/**
 * Account Page Template (Alias for Dashboard).
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

include_view('site.account.dashboard', [
    'customer'         => view_data('customer'),
    'user'             => view_data('user'),
    'orders'           => view_data('orders'),
    'billing_address'  => view_data('billing_address'),
    'shipping_address' => view_data('shipping_address'),
]);
