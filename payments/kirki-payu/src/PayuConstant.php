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
    const PRODUCTION_BASE_URL = 'https://secure.payu.com/';
    const SANDBOX_BASE_URL = 'https://secure.snd.payu.com/';
    const CLIENT_CREDENTIAL = 'client_credentials';
    const OAUTH_CONTEXT = 'pl/standard/user/oauth/authorize';
    const API_VERSION = 'api/v2_1/';
}
