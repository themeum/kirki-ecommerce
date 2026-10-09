<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Types of shipping method.
 *
 * @since 1.0.0
 */
class ShippingMethodTypes
{
    use HasConstants;
    const FLAT_RATE = 'flat_rate';
    const LOCAL_PICKUP = 'local_pickup';
    const WEIGHT_BASED = 'weight';
}
