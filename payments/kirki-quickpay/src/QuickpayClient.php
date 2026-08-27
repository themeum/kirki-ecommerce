<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use WP_Error;

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
     * Send a request to the QuickPay API and decode the JSON response.
     *
     * @param string $method Either 'post' or 'get'.
     * @param string $url The full request URL.
     * @param array $payload The request payload, for 'post' requests.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $method, string $url, array $payload = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic')->with_headers(['Accept-Version' => 'v10']);

        switch ($method) {
            case QuickpayConstant::POST_METHOD:
                $response = $request->with_body(wp_json_encode($payload))->post($url);
                break;

            case QuickpayConstant::PUT_METHOD:
                $response = $request->with_body(wp_json_encode($payload))->put($url);
                break;

            case QuickpayConstant::GET_METHOD:
                $response = $request->get($url);
                break;

            default:
                $response = null;
                break;
        }

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

    public function create_payment(array $payload)
    {
        $url = QuickpayConstant::API_URL . 'payments';
        return $this->send(QuickpayConstant::POST_METHOD, $url, $payload);
    }

    public function create_payment_link(array $payload, int $payment_id)
    {
        $url = QuickpayConstant::API_URL . sprintf("/payments/%s/link", $payment_id);
        return $this->send(QuickpayConstant::PUT_METHOD, $url, $payload);
    }

    public function is_verified(string $payload)
    {
        $given_checksum = $_SERVER['HTTP_QUICKPAY_CHECKSUM_SHA256'] ?? '';

        if (empty($given_checksum)) {
            return false;
        }

        $expected_checksum = hash_hmac('sha256', $payload, $this->private_key);

        return hash_equals($given_checksum, $expected_checksum);
    }
}
