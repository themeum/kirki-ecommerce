<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

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
    protected ?string $access_token = null;

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
        $request = Http::with_token($this->get_access_token())
            ->with_options(['redirection' => 0]);

        $response = PayuConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload))->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    public function create_order(array $payload)
    {
        $endpoint = $this->get_base_url() . PayuConstant::API_VERSION . 'orders';
        return $this->send($endpoint, PayuConstant::POST_METHOD, $payload);
    }

    /**
     * @return string The API base URL for the configured environment.
     */
    protected function get_base_url(): string
    {
        return $this->sandbox ? PayuConstant::SANDBOX_BASE_URL : PayuConstant::PRODUCTION_BASE_URL;
    }

    /**
     * Get an OAuth access token, fetching one on first use.
     *
     * @return string
     * @throws Exception If the token request fails or returns no token.
     */
    protected function get_access_token(): string
    {
        if ($this->access_token) {
            return $this->access_token;
        }

        $response = $this->create_access_token();
        throw_if(empty($response['access_token']), __('Access Token Not Found.', 'kirki-ecommerce-payu'));
        $this->access_token = $response['access_token'];

        return $this->access_token;
    }

    /**
     * Request a fresh OAuth access token.
     *
     * This request is deliberately not routed through send(), which requires a
     * token of its own.
     *
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function create_access_token(): array
    {
        $endpoint = $this->get_base_url() . PayuConstant::OAUTH_CONTEXT;

        $response = Http::as_form()->post($endpoint, [
            'grant_type' => PayuConstant::CLIENT_CREDENTIAL,
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
        ]);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }
}
