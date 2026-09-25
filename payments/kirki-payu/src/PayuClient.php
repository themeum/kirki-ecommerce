<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Http\Client\Response;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * HTTP client for the PayU GPO Europe REST API.
 */
class PayuClient
{
    protected string $client_id;
    protected string $client_secret;
    protected string $second_key;
    protected bool $sandbox;
    protected ?string $access_token = null;

    /**
     * @param string $client_id OAuth client ID.
     * @param string $client_secret OAuth client secret.
     * @param string $second_key Second key (MD5) PayU signs webhook notifications with.
     * @param bool $sandbox Whether to use the sandbox API endpoint.
     */
    public function __construct(string $client_id, string $client_secret, string $second_key, bool $sandbox = false)
    {
        $this->client_id = $client_id;
        $this->client_secret = $client_secret;
        $this->second_key = $second_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Create a PayU order.
     *
     * @param array $payload The order payload.
     * @return array The decoded JSON response, carrying redirectUri and orderId.
     * @throws Exception If the API request fails.
     */
    public function create_order(array $payload): array
    {
        return $this->post(PayuConstant::ORDERS_ENDPOINT, $payload);
    }

    /**
     * Verify a webhook payload against the OpenPayU signature header.
     *
     * @param string $raw_payload The raw webhook request body.
     * @return bool
     */
    public function is_verified(string $raw_payload): bool
    {
        $signature = $this->parse_signature($this->read_signature_header());

        if (empty($signature['signature']) || empty($signature['algorithm'])) {
            return false;
        }

        $algorithm = PayuConstant::SIGNATURE_ALGORITHMS[strtoupper($signature['algorithm'])] ?? null;

        if (null === $algorithm) {
            return false;
        }

        return hash_equals(hash($algorithm, $raw_payload . $this->second_key), $signature['signature']);
    }

    /**
     * POST a JSON payload to an authenticated PayU endpoint.
     *
     * Redirects are left unfollowed: PayU answers order creation with a 302 whose
     * body carries the JSON response, and following it yields the hosted payment
     * page's HTML instead.
     *
     * @param string $endpoint Endpoint path, relative to the environment base URL.
     * @param array $payload The request payload.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function post(string $endpoint, array $payload): array
    {
        $response = Http::with_token($this->get_access_token())
            ->with_options(['redirection' => 0])
            ->with_body(wp_json_encode($payload))
            ->post($this->get_base_url() . $endpoint);

        return $this->decode_response($response);
    }

    /**
     * Get an OAuth access token, fetching one on first use.
     *
     * The token request is issued directly rather than through post(), which
     * needs a token of its own.
     *
     * @return string
     * @throws Exception If the token request fails or returns no token.
     */
    protected function get_access_token(): string
    {
        if ($this->access_token) {
            return $this->access_token;
        }

        $response = Http::as_form()->post($this->get_base_url() . PayuConstant::OAUTH_ENDPOINT, [
            'grant_type' => PayuConstant::GRANT_TYPE,
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
        ]);

        $token = $this->decode_response($response)['access_token'] ?? '';

        throw_if(empty($token), __('PayU access token not found.', 'kirki-ecommerce-payu'));

        $this->access_token = $token;

        return $this->access_token;
    }

    /**
     * Decode a PayU response body, throwing on an error status.
     *
     * @param Response $response
     * @return array The decoded JSON response.
     * @throws Exception If the request failed or the body was not JSON.
     */
    protected function decode_response(Response $response): array
    {
        throw_if($response->failed(), $response->body());

        $decoded = $response->json();

        throw_if(!is_array($decoded), __('Unexpected response from PayU.', 'kirki-ecommerce-payu'));

        return $decoded;
    }

    /**
     * Get the API base URL for the configured environment.
     *
     * @return string
     */
    protected function get_base_url(): string
    {
        return $this->sandbox ? PayuConstant::SANDBOX_BASE_URL : PayuConstant::PRODUCTION_BASE_URL;
    }

    /**
     * Read the OpenPayU signature header sent with the notification.
     *
     * @return string Empty when no signature header is present.
     */
    protected function read_signature_header(): string
    {
        foreach (PayuConstant::SIGNATURE_HEADERS as $header) {
            $value = Superglobals::server($header, '');

            if (!empty($value)) {
                return $value;
            }
        }

        return '';
    }

    /**
     * Parse a "key=value;key=value" signature header into its pairs.
     *
     * @param string $header The raw header value.
     * @return array<string, string> Empty when the header is missing or malformed.
     */
    protected function parse_signature(string $header): array
    {
        $signature = [];

        foreach (explode(';', rtrim($header, ';')) as $pair) {
            $parts = explode('=', $pair, 2);

            if (count($parts) !== 2) {
                return [];
            }

            $signature[$parts[0]] = $parts[1];
        }

        return $signature;
    }
}
