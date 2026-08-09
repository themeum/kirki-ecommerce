<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Razorpay Payments API.
 */
class RazorpayClient
{

    protected $key_id;
    protected $key_secret;
    protected $test_mode;

    public function __construct(string $key_id, string $key_secret, bool $test_mode)
    {
        $this->key_id = $key_id;
        $this->key_secret = $key_secret;
        $this->test_mode = $test_mode;
    }

    public function post(array $payload, string $endpoint)
    {
        $response = Http::with_token($this->get_auth())
            ->with_body(wp_json_encode($payload))
            ->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function get_auth()
    {
        if (empty($this->key_id) || empty($this->key_secret)) {
            throw new InvalidArgumentException(__('Invalid API Key Or Key Secret.', 'kirki-razorpay'));
        }
        return base64_encode($this->key_id . ':' . $this->key_secret);
    }
}
