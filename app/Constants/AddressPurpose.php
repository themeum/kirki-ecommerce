<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

/**
 * Purposes a saved address can serve: shipping or billing.
 *
 * @since 1.0.0
 */
class AddressPurpose
{
    const SHIPPING = 'shipping';
    const BILLING = 'billing';
}
