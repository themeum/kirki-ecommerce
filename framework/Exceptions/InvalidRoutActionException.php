<?php

namespace Kirki\Ecommerce\Exceptions;

use Exception;

/**
 * Exception thrown when a route action is invalid or improperly defined.
 *
 * This includes issues like non-existent controllers, incorrect method names,
 * or misconfigured route syntax.
 *
 * @since 1.0.0
 */
class InvalidRoutActionException extends Exception
{
    // You can extend this later with custom message formatting or logging.
}
