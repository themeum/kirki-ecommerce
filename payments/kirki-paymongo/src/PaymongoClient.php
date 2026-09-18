<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * HTTP client for the PayMongo Payments API.
 */
class PaymongoClient
{
    protected string $secret_key;
    protected string $webhook_secret_key;
    protected bool $sandbox;

    /**
     * @param string $secret_key PayMongo API secret key, used as the HTTP Basic Auth username.
     * @param string $webhook_secret_key PayMongo webhook signing secret.
     * @param bool $sandbox True when the account is in test mode.
     */
    public function __construct(string $secret_key, string $webhook_secret_key, bool $sandbox = false)
    {
        $this->secret_key = $secret_key;
        $this->webhook_secret_key = $webhook_secret_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Verify a webhook payload against PayMongo's HMAC-SHA256 signature header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.
        $header = $_SERVER[PaymongoConstant::SIGNATURE_HEADER] ?? '';

        if (empty($raw_payload) || empty($header)) {
            return false;
        }

        // Header looks like: t=TIMESTAMP,te=HASH (test) OR t=TIMESTAMP,li=HASH (live).
        $segments = [];
        foreach (explode(',', $header) as $segment) {
            [$key, $value] = array_pad(explode('=', trim($segment), 2), 2, '');
            $segments[$key] = $value;
        }

        $timestamp = $segments['t'] ?? '';
        $given_signature = $this->sandbox ? ($segments['te'] ?? '') : ($segments['li'] ?? '');

        if (empty($timestamp) || empty($given_signature)) {
            return false;
        }

        $expected_signature = hash_hmac('sha256', $timestamp . '.' . $raw_payload, $this->webhook_secret_key);

        return hash_equals($expected_signature, $given_signature);
    }

    /**
     * Create a PayMongo checkout session for an order.
     *
     * @param array $payload The checkout session request payload.
     * @param string $idempotency_key Key PayMongo uses to collapse retries of the same request.
     * @return array The decoded JSON response, including the session's checkout_url.
     * @throws Exception If the API request fails.
     */
    public function create_checkout_session(array $payload, string $idempotency_key): array
    {
        return $this->send(
            PaymongoConstant::POST_METHOD,
            PaymongoConstant::API_CHECKOUT_SESSIONS_URL,
            $payload,
            ['Idempotency-Key' => $idempotency_key]
        );
    }

    /**
     * Send a request to the PayMongo API and decode the JSON response.
     *
     * @param string $method One of PaymongoConstant::POST_METHOD or ::GET_METHOD.
     * @param string $url The full request URL.
     * @param array $payload The request payload, for 'post' requests.
     * @param array $headers Extra request headers.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $method, string $url, array $payload = [], array $headers = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic')->with_headers($headers);

        if (PaymongoConstant::GET_METHOD !== $method) {
            $request = $request->with_body(wp_json_encode($payload));
        }

        $response = $request->{$method}($url);

        throw_if($response->failed(), $response->body());

        return $response->json();
    }

    /**
     * Build the HTTP Basic Auth token from the configured credentials.
     *
     * @return string Base64-encoded "secret_key:", PayMongo sends no password.
     * @throws InvalidArgumentException If the secret key is missing.
     */
    protected function get_auth(): string
    {
        throw_if(empty($this->secret_key), __('Invalid API Key.', 'kirki-ecommerce-paymongo'), InvalidArgumentException::class);

        return base64_encode($this->secret_key . ':');
    }
}
