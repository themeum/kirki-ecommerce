<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Square Payments API.
 */
class PaystackClient
{
    protected string $location_id;
    protected string $access_token;
    protected bool $sandbox;
    protected string $signature_key;

    /**
     * @param string $location_id Square location ID.
     * @param string $access_token Square API access token.
     * @param string $signature_key Signature key used to verify webhook notifications.
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $location_id, string $access_token, string $signature_key, bool $sandbox = false)
    {
        $this->location_id = $location_id;
        $this->access_token = $access_token;
        $this->signature_key = $signature_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Verify a webhook payload against Square's HMAC-SHA256 signature header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @param string $webhook_url The notification URL configured in Square, as sent to it verbatim.
     * @return bool
     */
    public function is_verified(string $raw_payload, string $webhook_url): bool
    {
        $given_signature = $_SERVER['HTTP_X_SQUARE_HMACSHA256_SIGNATURE'] ?? $_SERVER['HTTP_X_SQUARE_SIGNATURE'] ?? '';

        if ('' === $raw_payload || '' === $given_signature) {
            return false;
        }

        $hash = hash_hmac('sha256', $webhook_url . $raw_payload, $this->signature_key, true);
        $expected_signature = base64_encode($hash);

        return $expected_signature === $given_signature;
    }


    /**
     * Send a request to the Square API and decode the JSON response.
     *
     * @param string $endpoint The full request URL.
     * @param string $method Either SquareConstant::POST_METHOD or SquareConstant::GET_METHOD.
     * @param array $payload The request payload, for POST requests.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $endpoint, string $method, array $payload = []): array
    {
        $request = Http::with_token($this->access_token)
                    ->with_headers(['Square-Version' => SquareConstant::SQUARE_VERSION]);

        $response = SquareConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload))->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }
}
