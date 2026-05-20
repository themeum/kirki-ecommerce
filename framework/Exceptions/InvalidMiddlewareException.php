<?php

namespace Kirki\Ecommerce\Exceptions;

use Exception;

/**
 * Exception thrown when an invalid or non-existent middleware is used.
 *
 * This helps catch misconfigurations or typos in middleware assignment
 * during route registration.
 *
 * @since 1.0.0
 */
class InvalidMiddlewareException extends Exception
{
    // Custom logic can be added here if needed.
}
