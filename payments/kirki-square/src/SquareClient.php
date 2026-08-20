<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Square Payments API.
 */
class SquareClient
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
     * Create a Square Payment Link for an order.
     *
     * @param array $payload The payment link request payload.
     * @return array The decoded JSON response, including the payment_link.
     * @throws Exception If the API request fails.
     */
    public function create_payment_link(array $payload): array
    {
        return $this->send($this->payment_link_url(), SquareConstant::POST_METHOD, $payload);
    }

    /**
     * Fetch an order from Square's Orders API.
     *
     * @param string $square_order_id Square's order ID.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    public function get_order(string $square_order_id): array
    {
        return $this->send($this->order_url($square_order_id), SquareConstant::GET_METHOD);
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

    /**
     * Endpoint for creating a new payment link.
     * @return string
     */
    protected function payment_link_url(): string
    {
        return $this->get_base_url() . SquareConstant::PAYMENT_LINK;
    }

    /**
     * Endpoint for a specific Square order.
     *
     * @param string $square_order_id Square's order ID.
     * @return string
     */
    protected function order_url(string $square_order_id): string
    {
        return $this->get_base_url() . SquareConstant::ORDER_LINK . "/{$square_order_id}";
    }

    /**
     * @return string The API base URL for the configured environment.
     */
    protected function get_base_url(): string
    {
        return $this->sandbox ? SquareConstant::SANDBOX_BASE_URL : SquareConstant::PRODUCTION_BASE_URL;
    }
}
