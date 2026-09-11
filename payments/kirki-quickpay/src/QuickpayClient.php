<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the QuickPay Payments API.
 */
class QuickpayClient
{
    protected string $api_key;
    protected string $private_key;
    protected bool $sandbox;

    /**
     * @param string $api_key QuickPay API api_key.
     * @param string $private_key QuickPay API private_key.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $api_key, string $private_key, bool $sandbox = false)
    {
        $this->api_key = $api_key;
        $this->private_key = $private_key;
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

    /**
     * Create a QuickPay payment.
     *
     * @param array $payload The payment request payload.
     * @return array The decoded JSON response, including the payment id.
     * @throws Exception If the API request fails.
     */
    public function create_payment(array $payload): array
    {
        return $this->send(QuickpayConstant::POST_METHOD, QuickpayConstant::API_URL . 'payments', $payload);
    }

    /**
     * Create a QuickPay payment link for an existing payment.
     *
     * @param array $payload The payment link request payload.
     * @param int $payment_id The QuickPay payment ID to attach the link to.
     * @return array The decoded JSON response, including the link url.
     * @throws Exception If the API request fails.
     */
    public function create_payment_link(array $payload, int $payment_id): array
    {
        $url = QuickpayConstant::API_URL . "payments/{$payment_id}/link";

        return $this->send(QuickpayConstant::PUT_METHOD, $url, $payload);
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
        $request = Http::with_token($this->get_auth(), 'Basic')
            ->with_headers(['Accept-Version' => 'v' . QuickpayConstant::API_VERSION]);

        if (QuickpayConstant::GET_METHOD !== $method) {
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
            throw new InvalidArgumentException(__('Invalid API Key.', 'kirki-ecommerce-quickpay'));
        }

        return base64_encode(":{$this->api_key}");
    }
}
