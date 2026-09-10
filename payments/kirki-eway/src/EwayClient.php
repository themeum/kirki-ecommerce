<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the QuickPay Payments API.
 */
class EwayClient
{
    protected string $api_key;
    protected string $api_password;
    protected bool $sandbox;

    /**
     * @param string $api_key Eway API api_key.
     * @param string $api_password Eway API Password.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $api_key, string $api_password, bool $sandbox = false)
    {
        $this->api_key = $api_key;
        $this->api_password = $api_password;
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

    public function create_transaction(array $payload): array
    {
        return $this->send(EwayConstant::POST_METHOD, $this->get_base_url() . EwayConstant::API_ACCESS_CODE_SHARED, $payload);
    }

    protected function send(string $method, string $url, array $payload = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic')
            ->with_headers(['X-EWAY-APIVERSION' => EwayConstant::API_VERSION]);

        if (EwayConstant::GET_METHOD !== $method) {
            $request = $request->with_body(wp_json_encode($payload));
        }

        $response = $request->{$method}($url);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function get_base_url(): string
    {
        return $this->sandbox ? EwayConstant::ENDPOINT_SANDBOX : EwayConstant::ENDPOINT_PRODUCTION;
    }

    protected function get_auth()
    {
        if (empty($this->api_key) || empty($this->api_password)) {
            throw new InvalidArgumentException(__('Invalid API Key Or API Password.', 'kirki-ecommerce-eway'));
        }
        return base64_encode($this->api_key . ':' . $this->api_password);
    }
}
