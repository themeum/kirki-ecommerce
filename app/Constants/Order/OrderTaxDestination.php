<?php

namespace Kirki\Ecommerce\App\Constants\Order;

defined('ABSPATH') || exit;

/**
 * Addresses an order's tax can be calculated from: shipping, billing or store.
 *
 * @since 1.0.0
 */
final class OrderTaxDestination
{
    const SHIPPING = 'shipping';
    const BILLING = 'billing';
    const STORE = 'store';
}
