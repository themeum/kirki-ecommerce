<?php

namespace Kirki\Ecommerce\Payments;

use Exception;

defined('ABSPATH') || exit;

/**
 * Thrown when a request has no clear result, so the money may or may not have moved.
 */
class SslcommerzUnknownResultException extends Exception
{
}
