<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

class MollieClient
{
    protected $api_key;
    protected $test_mode;

    public function __construct(string $api_key, bool $test_mode = false)
    {
        if (! (bool) preg_match(MollieConstant::API_KEY_PATTERN, \trim($api_key))) {
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-mollie'));
        }

        if ((bool)strpos($api_key, 'test_') && !$test_mode) {
            throw new InvalidArgumentException(__('Invalid API Key For Sandbox Mode.', 'kirki-mollie'));
        }
        $this->api_key = $api_key;
        $this->test_mode = $test_mode;
    }

    public function is_test_mode(): bool
    {
        return $this->test_mode;
    }

    public function post(array $payload, string $endpoint)
    {
        $response = Http::with_token($this->api_key)
            ->with_body(wp_json_encode($payload))
            ->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    public function get(string $endpoint)
    {
        $response = Http::with_token($this->api_key)
            ->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }
}
