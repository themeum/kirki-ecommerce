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
        $api_key = trim($api_key);

        if (!preg_match(MollieConstant::API_KEY_PATTERN, $api_key)) {
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-mollie'));
        }

        $is_test_key = strpos($api_key, 'test_') === 0;
        if ($is_test_key && !$test_mode) {
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-mollie'));
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
