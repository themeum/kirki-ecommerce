<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Razorpay Payments API integration.
 */
class KlarnaConstant
{
    use HasConstants;

    const API_URLS = array(
        'eu' => array(
            'production' => 'https://api.klarna.com/',
            'sandbox' => 'https://api.playground.klarna.com/',
        ),
        'na' => array(
            'production' => 'https://api-na.klarna.com/',
            'sandbox' => 'https://api-na.playground.klarna.com/',
        ),
        'oc' => array(
            'production' => 'https://api-oc.klarna.com/',
            'sandbox' => 'https://api-oc.playground.klarna.com/',
        ),
    );
}
