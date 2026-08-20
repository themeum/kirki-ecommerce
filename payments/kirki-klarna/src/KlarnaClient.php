<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Klarna Payments API.
 */
class KlarnaClient
{
    protected string $username;
    protected string $password;
    protected string $region;
    protected bool $sandbox;

    /**
     * @param string $username Klarna API username.
     * @param string $password Klarna API password.
     * @param string $region Merchant region: 'eu', 'na', or 'oc'.
     * @param bool $sandbox Whether to use the sandbox API endpoints.
     */
    public function __construct(string $username, string $password, string $region, bool $sandbox = false)
    {
        $this->username = $username;
        $this->password = $password;
        $this->region = $region;
        $this->sandbox = $sandbox;
    }

    /**
     * Create a Klarna payment session for an order.
     *
     * @param array $payload The payment session request payload.
     * @return array The decoded JSON response, including the session_id.
     * @throws Exception If the API request fails.
     */
    public function create_payment_session(array $payload): array
    {
        return $this->send('post', $this->payment_session_url(), $payload);
    }

    /**
     * Create a Klarna Hosted Payment Page (HPP) session for a payment session.
     *
     * @param array $payload The HPP session request payload.
     * @param string $idempotency_key Value sent as the Klarna-Idempotency-Key header.
     * @return array The decoded JSON response, including the redirect_url.
     * @throws Exception If the API request fails.
     */
    public function create_hpp_session(array $payload, string $idempotency_key): array
    {
        return $this->send('post', $this->hpp_session_url(), $payload, [
            'Klarna-Idempotency-Key' => $idempotency_key,
        ]);
    }

    /**
     * Fetch an order from Klarna's Order Management API.
     *
     * @param string $klarna_order_id Klarna's order ID.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    public function get_order(string $klarna_order_id): array
    {
        return $this->send('get', $this->order_management_url() . $klarna_order_id);
    }

    /**
     * Build the resource URL for an existing payment session.
     *
     * @param string $session_id The payment session ID.
     * @return string
     */
    public function payment_session_resource_url(string $session_id): string
    {
        return $this->payment_session_url() . "/{$session_id}";
    }

    /**
     * Get the API base URL for the configured region and mode.
     *
     * @return string
     * @throws InvalidArgumentException If the configured region is not recognized.
     */
    public function get_base_url(): string
    {
        $url = KlarnaConstant::API_URLS[$this->region][$this->get_mode()] ?? null;

        if (empty($url)) {
            throw new InvalidArgumentException(__('Invalid Klarna region.', 'kirki-ecommerce-klarna'));
        }

        return $url;
    }

    /**
     * Send a request to the Klarna API and decode the JSON response.
     *
     * @param string $method Either 'post' or 'get'.
     * @param string $url The full request URL.
     * @param array $payload The request payload, for 'post' requests.
     * @param array $headers Extra request headers.
     * @return array The decoded JSON response.
     * @throws Exception If the API request fails.
     */
    protected function send(string $method, string $url, array $payload = [], array $headers = []): array
    {
        $request = Http::with_token($this->get_auth(), 'Basic');

        if (!empty($headers)) {
            $request = $request->with_headers($headers);
        }

        $response = 'post' === $method
            ? $request->with_body(wp_json_encode($payload))->post($url)
            : $request->get($url);

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
        if (empty($this->username) || empty($this->password)) {
            throw new InvalidArgumentException(__('Invalid Username Or Password.', 'kirki-ecommerce-klarna'));
        }

        return base64_encode($this->username . ':' . $this->password);
    }

    /**
     * @return string Either KlarnaConstant::SANDBOX or KlarnaConstant::PRODUCTION.
     */
    protected function get_mode(): string
    {
        return $this->sandbox ? KlarnaConstant::SANDBOX : KlarnaConstant::PRODUCTION;
    }

    /**
     * Endpoint for creating a new payment session.
     * @return string
     */
    protected function payment_session_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::PAYMENT_SESSION;
    }

    /**
     * Endpoint for creating a new Hosted Payment Page session.
     * @return string
     */
    protected function hpp_session_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::HPP_SESSION;
    }

    /**
     * Base endpoint for the Order Management API.
     * @return string
     */
    protected function order_management_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::ORDER;
    }
}
