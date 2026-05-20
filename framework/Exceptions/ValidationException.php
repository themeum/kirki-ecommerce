<?php

namespace Kirki\Ecommerce\Exceptions;

use Kirki\Ecommerce\Http\Response;
use Exception;

/**
 * Exception thrown when validation fails.
 *
 * @since 1.0.0
 */
class ValidationException extends Exception
{
    /** @var array<string> */
    protected $errors;

    /**
     * @return static
     */
    public static function with_errors(array $errors, string $message = 'Validation failed!')
    {
        $code = Response::UNPROCESSABLE_ENTITY;
        $instance = new static($message, $code);
        $instance->errors = $errors;
        return $instance;
    }

    public function get_errors()
    {
        return $this->errors;
    }
}
