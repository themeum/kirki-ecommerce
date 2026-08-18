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
class SquareClient
{
    protected $location_id;
    protected $access_token;
    protected $sandbox;
    protected $signature_key;

    /**
     * @param string $location_id
     * @param string $access_token
     * @param string $signature_key
     */
    public function __construct(string $location_id, string $access_token, string $signature_key, bool $sandbox = false)
    {
        $this->location_id = $location_id;
        $this->access_token = $access_token;
        $this->signature_key = $signature_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Send a POST request to the Razorpay API.
     *
     * @param array $payload
     * @param string $endpoint
     * @return mixed Decoded JSON response.
     * @throws Exception If the request fails.
     */
    public function post(array $payload, string $endpoint)
    {
        $response = Http::with_token($this->get_auth(), 'Basic')
            ->with_body(wp_json_encode($payload))
            ->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    /**
     * Build the HTTP Basic auth token from the key ID and secret.
     *
     * @return string
     * @throws InvalidArgumentException If the key ID or secret is missing.
     */
    protected function get_auth()
    {
        // if (empty($this->key_id) || empty($this->key_secret)) {
        //     throw new InvalidArgumentException(__('Invalid API Key Or Key Secret.', 'kirki-ecommerce-razorpay'));
        // }
        // return base64_encode($this->key_id . ':' . $this->key_secret);
    }

    /**
     * Verify a webhook payload's signature against the configured webhook secret.
     *
     * @param string $raw_payload
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        $given_signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
        $expected_signature = hash_hmac(RazorpayConstant::SHA256, $raw_payload, $this->webhook_secret);

        return hash_equals($expected_signature, $given_signature);
    }

    public function send(array $payload, string $method)
    {
        $endpoint = call_user_func(array($this, $method));

        $response = Http::with_token($this->access_token)
            ->with_body(wp_json_encode($payload))
            ->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    public function payment_link_url(): string
    {
        $endpoint = $this->sandbox ? SquareConstant::SANDBOX_BASE_URL : SquareConstant::PRODUCTION_BASE_URL;

        return $endpoint . SquareConstant::PAYMENT_LINK;
    }
}
