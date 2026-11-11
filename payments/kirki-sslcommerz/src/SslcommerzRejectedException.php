<?php

namespace Kirki\Ecommerce\Payments;

use Exception;

defined('ABSPATH') || exit;

/**
 * Thrown when SSLCommerz gives a final answer that refuses a request.
 */
class SslcommerzRejectedException extends Exception
{
}
