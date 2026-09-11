<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the PayStack API.
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
        $given_signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
        $request_method = $_SERVER['REQUEST_METHOD'] ?? '';

        if (strtoupper($request_method) !== 'POST' || empty($given_signature) || empty($raw_payload)) {
            return false;
        }

        $expected_signature = hash_hmac('sha512', $raw_payload, $this->secret_key);

        return hash_equals($expected_signature, $given_signature);
    }


    /**
     * Send a request to the PayStack API and decode the JSON response.
     *
     * @param string $endpoint The full request URL.
     * @param string $method Either PaystackConstant::POST_METHOD or PaystackConstant::GET_METHOD.
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

    /**
     * Initialize a transaction and get the checkout authorization URL.
     *
     * @param array $payload The transaction payload from PaystackTransactionBuilder.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    public function initialize_transaction(array $payload): array
    {
        $url = PaystackConstant::BASE_URL . '/transaction/initialize';

        return $this->send($url, PaystackConstant::POST_METHOD, $payload);
    }

    /**
     * Verify a transaction by its reference.
     *
     * @param string $reference_id The order UUID used as the transaction reference.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    public function verify_transaction(string $reference_id): array
    {
        $url = PaystackConstant::BASE_URL . "/transaction/verify/{$reference_id}";

        return $this->send($url, PaystackConstant::GET_METHOD);
    }
}
