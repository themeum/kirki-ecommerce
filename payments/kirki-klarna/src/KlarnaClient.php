<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Razorpay Payments API.
 */
class KlarnaClient
{
    public function __construct(bool $sandbox = false)
    {
        $this->sandbox = $sandbox;
    }

    public function is_verified(string $raw_payload): bool
    {
    }

    public function send()
    {
    }
}
