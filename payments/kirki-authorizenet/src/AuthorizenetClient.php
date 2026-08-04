<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Authorize.Net API.
 */
class AuthorizenetClient
{
    protected string $login_id;
    protected string $transaction_key;
    protected string $signature_key;
    protected bool $sandbox;
    protected array $authentication = [];
    protected array $supported_currencies = [];

    /**
     * @param string $login_id Authorize.Net API login ID.
     * @param string $transaction_key Authorize.Net API transaction key.
     * @param string $signature_key Signature key used to verify webhook notifications.
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $login_id, string $transaction_key, string $signature_key, bool $sandbox = false)
    {
        $this->login_id = $login_id;
        $this->transaction_key = $transaction_key;
        $this->sandbox = $sandbox;
        $this->signature_key = $signature_key;
    }

    /**
     * Whether the gateway is running against Authorize.Net's sandbox environment.
     * @return bool
     */
    public function is_sandbox(): bool
    {
        return $this->sandbox;
    }

    /**
     * Merchant authentication block required on every AuthorizeNet request.
     *
     * @return array
     */
    public function authentication(): array
    {
        if (!empty($this->authentication)) {
            return $this->authentication;
        }

        return $this->authentication = [
            'name' => $this->login_id,
            'transactionKey' => $this->transaction_key,
        ];
    }

    /**
     * Currencies enabled on the merchant account.
     *
     * @return string[]
     */
    public function supported_currencies(): array
    {
        if (!empty($this->supported_currencies)) {
            return $this->supported_currencies;
        }

        $response = $this->send([
            'getMerchantDetailsRequest' => [
                'merchantAuthentication' => $this->authentication(),
            ],
        ]);

        return $this->supported_currencies = $response->currencies ?? [];
    }

    /**
     * Send a request to the AuthorizeNet API and decode the JSON response.
     *
     * @param array $payload The request payload.
     * @return object The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    public function send(array $payload)
    {
        $response = Http::as_json()
            ->with_body(wp_json_encode($payload))
            ->post($this->endpoint());

        if ($response->failed()) {
            throw new Exception(sprintf(__('AuthorizeNet API Error: %s', 'kirki-ecommerce'), $response->body()));
        }

        return $this->decode($response->__toString());
    }

    /**
     * Authorize.Net API endpoint for the current environment.
     * @return string
     */
    protected function endpoint(): string
    {
        return $this->sandbox ? AuthorizenetConstant::SANDBOX_API_ENDPOINT : AuthorizenetConstant::PRODUCTION_API_ENDPOINT;
    }

    /**
     * AuthorizeNet sometimes prefixes its JSON responses with a UTF-8 BOM.
     *
     * @param string $body The raw response body.
     * @return object The decoded JSON response.
     */
    protected function decode(string $body)
    {
        $bom = pack('CCC', 0xef, 0xbb, 0xbf);

        if (0 === strncmp(substr($body, 0, 3), $bom, 3)) {
            $body = substr($body, 3);
        }

        return json_decode($body);
    }

    /**
     * Verify a webhook payload against Authorize.Net's HMAC-SHA512 signature header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified($raw_payload): bool
    {
        // Get the headers and convert them to uppercase.
        $headers = array_change_key_case(getallheaders(), CASE_UPPER);

        if (! isset($headers['X-ANET-SIGNATURE'])) {
            return false;
        }

        $calculated_signature = hash_hmac('sha512', $raw_payload, $this->signature_key);

        return hash_equals(strtolower($headers['X-ANET-SIGNATURE']), 'sha512=' . $calculated_signature);
    }
}
