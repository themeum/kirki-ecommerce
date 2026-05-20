<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class ShippingMethodTypes
{
    use HasConstants;
    const FLAT_RATE = 'flat_rate';
    const LOCAL_PICKUP = 'local_pickup';
    const WEIGHT_BASED = 'weight';
}
