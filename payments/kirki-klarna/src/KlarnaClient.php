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

    public function __construct(string $username, string $password, string $region, bool $sandbox = false)
    {
        $this->username = $username;
        $this->password = $password;
        $this->region = $region;
        $this->sandbox = $sandbox;
    }

    public function create_payment_session(array $payload): array
    {
        return $this->send('post', $this->payment_session_url(), $payload);
    }

    public function create_hpp_session(array $payload, string $idempotency_key): array
    {
        return $this->send('post', $this->hpp_session_url(), $payload, [
            'Klarna-Idempotency-Key' => $idempotency_key,
        ]);
    }

    public function get_order(string $klarna_order_id): array
    {
        return $this->send('get', $this->order_management_url() . $klarna_order_id);
    }

    public function payment_session_resource_url(string $session_id): string
    {
        return $this->payment_session_url() . "/{$session_id}";
    }

    public function get_base_url(): string
    {
        $url = KlarnaConstant::API_URLS[$this->region][$this->get_mode()] ?? null;

        if (empty($url)) {
            throw new InvalidArgumentException(__('Invalid Klarna region.', 'kirki-ecommerce-klarna'));
        }

        return $url;
    }

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

    protected function get_auth(): string
    {
        if (empty($this->username) || empty($this->password)) {
            throw new InvalidArgumentException(__('Invalid Username Or Password.', 'kirki-ecommerce-klarna'));
        }

        return base64_encode($this->username . ':' . $this->password);
    }

    protected function get_mode(): string
    {
        return $this->sandbox ? KlarnaConstant::SANDBOX : KlarnaConstant::PRODUCTION;
    }

    protected function payment_session_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::PAYMENT_SESSION;
    }

    protected function hpp_session_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::HPP_SESSION;
    }

    protected function order_management_url(): string
    {
        return $this->get_base_url() . KlarnaConstant::ORDER;
    }
}
