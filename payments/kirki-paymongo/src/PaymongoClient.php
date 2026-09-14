<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the QuickPay Payments API.
 */
class PaymongoClient
{
    protected string $secret_key;
    protected bool $sandbox;

    /**
     * @param string $secret_key PayMongo API secret_key.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $secret_key, bool $sandbox = false)
    {
        $this->secret_key = $secret_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Verify a webhook payload against QuickPay's HMAC-SHA256 checksum header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        $given_checksum = $_SERVER['HTTP_QUICKPAY_CHECKSUM_SHA256'] ?? '';

        if (empty($raw_payload)  || empty($given_checksum)) {
            return false;
        }

        $expected_checksum = hash_hmac('sha256', $raw_payload, $this->private_key);

        return hash_equals($expected_checksum, $given_checksum);
    }

    public function create_checkout_session_url(array $payload): array
    {
        return $this->send(PayMongoConstant::POST_METHOD, PayMongoConstant::API_CHECKOUT_SESSIONS_URL, $payload);
    }

    /**
     * Send a request to the QuickPay API and decode the JSON response.
     *
     * @param string $method One of QuickpayConstant::POST_METHOD, ::PUT_METHOD or ::GET_METHOD.
     * @param string $url The full request URL.
     * @param array $payload The request payload, for 'post'/'put' requests.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $method, string $url, array $payload = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic');

        if (PayMongoConstant::GET_METHOD !== $method) {
            $request = $request->with_body(wp_json_encode($payload));
        }

        $response = $request->{$method}($url);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    /**
     * Build the HTTP Basic Auth token from the configured credentials.
     *
     * @return string Base64-encoded "username:password".
     * @throws InvalidArgumentException If the username or password is missing.
     */
    protected function get_auth(): string
    {
        if (empty($this->api_key)) {
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-ecommerce-paymongo'));
        }

        return base64_encode($this->secret_key . ':');
    }
}
