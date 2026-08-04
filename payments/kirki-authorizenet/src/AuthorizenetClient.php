<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * Thin HTTP client for the AuthorizeNet JSON API.
 */
class AuthorizenetClient
{
    private const SANDBOX_API_ENDPOINT = 'https://apitest.authorize.net/xml/v1/request.api';
    private const PRODUCTION_API_ENDPOINT = 'https://api.authorize.net/xml/v1/request.api';

    private string $login_id;
    private string $transaction_key;
    private bool $sandbox;
    private ?array $authentication = [];
    private ?array $supported_currencies = [];

    public function __construct(string $login_id, string $transaction_key, bool $sandbox = false)
    {
        $this->login_id = $login_id;
        $this->transaction_key = $transaction_key;
        $this->sandbox = $sandbox;
    }

    public function is_sandbox(): bool
    {
        return $this->sandbox;
    }

    /**
     * Merchant authentication block required on every AuthorizeNet request.
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
     * The AuthorizeNet API has no per-currency variant of this call — it always
     * returns the full list, so it's fetched once and cached for the request.
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
     * @throws Exception
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

    private function endpoint(): string
    {
        return $this->sandbox ? self::SANDBOX_API_ENDPOINT : self::PRODUCTION_API_ENDPOINT;
    }

    /**
     * AuthorizeNet sometimes prefixes its JSON responses with a UTF-8 BOM.
     */
    private function decode(string $body)
    {
        $bom = pack('CCC', 0xef, 0xbb, 0xbf);

        if (0 === strncmp(substr($body, 0, 3), $bom, 3)) {
            $body = substr($body, 3);
        }

        return json_decode($body);
    }
}
