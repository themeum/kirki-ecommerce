<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Square Payments API integration.
 */
class PayuConstant
{
    use HasConstants;

    const POST_METHOD = 'post';
    const GET_METHOD = 'get';
}
