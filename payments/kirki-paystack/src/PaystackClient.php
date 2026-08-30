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
    protected bool $sandbox;
    protected string $secret_key;

    /**
     * @param string $secret_key PayStack Secret key.
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $secret_key, bool $sandbox = false)
    {
        $this->secret_key = $secret_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Verify a webhook payload against PayStack's HMAC-sha512 signature header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        $given_signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? null;
        $request_method = $_SERVER['REQUEST_METHOD'];

        if ((strtoupper($request_method) != 'POST') || empty($given_signature) || empty($raw_payload)) {
            throw new Exception(__('Invalid Payload From PayStack.', 'kirki-ecommerce-paystack'));
        }

        $expected_signature = hash_hmac('sha512', $raw_payload, $this->secret_key);

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
        $request = Http::with_token($this->secret_key);

        $response = PaystackConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload))->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    public function initialize_transaction(array $payload)
    {
        $url = PaystackConstant::BASE_URL . '/transaction/initialize';

        return $this->send($url, PaystackConstant::POST_METHOD, $payload);
    }

    public function verify_transaction($reference_id)
    {
        $url = PaystackConstant::BASE_URL . "/transaction/verify/{$reference_id}";
        return $this->send($url, PaystackConstant::GET_METHOD);
    }
}
