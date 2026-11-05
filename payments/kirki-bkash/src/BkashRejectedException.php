<?php

namespace Kirki\Ecommerce\Payments;

use Exception;

defined('ABSPATH') || exit;

/**
 * Thrown when bKash gives a final answer that refuses a request.
 */
class BkashRejectedException extends Exception
{
    /** @var string */
    protected $external_code;

    /**
     * @param string $message       The error message from bKash.
     * @param string $external_code The bKash error code, when it sends one.
     */
    public function __construct(string $message, string $external_code = '')
    {
        parent::__construct($message);

        $this->external_code = $external_code;
    }

    /**
     * Get the bKash error code.
     *
     * @return string
     */
    public function external_code(): string
    {
        return $this->external_code;
    }
}
