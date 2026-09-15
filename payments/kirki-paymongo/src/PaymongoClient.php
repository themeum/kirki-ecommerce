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
    protected string $webhook_secret_key;
    protected bool $sandbox;

    /**
     * @param string $secret_key PayMongo API secret_key.
     * @param string $webhook_secret_key PayMongo WebHook secret_key.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $secret_key, string $webhook_secret_key, bool $sandbox = false)
    {
        $this->secret_key = $secret_key;
        $this->webhook_secret_key = $webhook_secret_key;
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
        $header = $_SERVER['HTTP_PAYMONGO_SIGNATURE'] ?? '';
        if (!$header) {
            return false;
        }

        // Header looks like: t=TIMESTAMP,te=HASH  (test)  OR  t=TIMESTAMP,li=HASH (live)
        $parts = [];
        foreach (array_map('trim', explode(',', $header)) as $pair) {
            [$key, $value] = array_pad(explode('=', $pair, 2), 2, '');
            $parts[$key] = $value;
        }

        $timestamp = $parts['t'] ?? '';
        $give_signature = $this->sandbox ? ($parts['te'] ?? '') : ($parts['li'] ?? '');

        if (!$timestamp || !$give_signature) {
            return false;
        }

        $signed = $timestamp . '.' . $raw_payload;
        $computed_signature = hash_hmac('sha256', $signed, $this->webhook_secret_key);

        return hash_equals($give_signature, $computed_signature);
    }

    public function create_checkout_session_url(array $payload, array $headers): array
    {
        return $this->send(PayMongoConstant::POST_METHOD, PayMongoConstant::API_CHECKOUT_SESSIONS_URL, $payload, $headers);
    }

    /**
     * Send a request to the QuickPay API and decode the JSON response.
     *
     * @param string $method One of QuickpayConstant::POST_METHOD, ::PUT_METHOD or ::GET_METHOD.
     * @param string $url The full request URL.
     * @param array $payload The request payload.
     * @param array $headers The request headers.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $method, string $url, array $payload = [], array $headers = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic');

        if(!empty($headers)){
            $request = $request->with_headers($headers);
        }

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
     * @return string Base64-encoded "username:".
     * @throws InvalidArgumentException If the username is missing.
     */
    protected function get_auth(): string
    {
        if (empty($this->secret_key)) {
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-ecommerce-paymongo'));
        }

        return base64_encode($this->secret_key . ':');
    }
}
