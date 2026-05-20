<?php

namespace Kirki\Ecommerce\Exceptions;

use Kirki\Ecommerce\Http\Response;
use RuntimeException;

/**
 * Exception thrown when a authorization fails.
 *
 * @since 1.0.0
 */
class AuthorizationException extends RuntimeException
{
    public function __construct($message = '', $code = 0, $previous = null)
    {
        if ($message === '') {
            $message = __('You have to be logged in', 'kirki-ecommerce');
        }

        if ($code === 0) {
            $code = Response::UNAUTHORIZED;
        }

        parent::__construct($message, $code, $previous);
    }
}
