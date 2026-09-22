<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use HttpRequest;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Square Payments API.
 */
class PayuClient
{
    protected string $pos_id;
    protected string $client_id;
    protected bool $sandbox;
    protected string $second_key;
    protected string $client_secret;
    protected string $access_token;

    /**
     * @param string $pos_id Square location ID.
     * @param string $client_id Square API access token.
     * @param string $second_key Signature key used to verify webhook notifications.
     * @param string $client_secret
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $pos_id, string $client_id, string $second_key, string $client_secret, bool $sandbox = false)
    {
        $this->pos_id = $pos_id;
        $this->client_id = $client_id;
        $this->second_key = $second_key;
        $this->client_secret = $client_secret;
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
    protected function send(string $endpoint, string $method, array $payload = [], $content_type = 'application/json'): array
    {
        $request = new Http();
        if ($this->access_token) {
            $request = $request->with_token($this->access_token);
        }

        //$payload = () need to add form-urlencode condition.
        $response = SquareConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload), $content_type)->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
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
        return $this->sandbox ? PayuConstant::SANDBOX_BASE_URL : PayuConstant::PRODUCTION_BASE_URL;
    }

    protected function get_access_token()
    {
        if ($this->access_token) {
            return $access_token;
        }

        $this->access_token = $this->create_access_token();
    }

    protected function create_access_token() {}
}
