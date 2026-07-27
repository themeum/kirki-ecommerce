<?php

namespace Kirki\Ecommerce\Exceptions;

use InvalidArgumentException;

/**
 * Exception thrown when a value cannot be parsed into a date.
 *
 * Extends InvalidArgumentException so callers that already guard date parsing
 * against invalid arguments keep working without change.
 *
 * @since 1.0.0
 */
class InvalidDateFormatException extends InvalidArgumentException
{
    // Custom logic can be added here if needed.
}
