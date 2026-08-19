<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Klarna Payments API.
 */
class KlarnaClient
{
    protected $username;
    protected $password;
    protected $region;
    protected $sandbox;

    public function __construct(string $username, string $password, string $region, bool $sandbox = false)
    {
        $this->username = $username;
        $this->password = $password;
        $this->region = $region;
        $this->sandbox = $sandbox;
    }

    public function post(array $payload, string $method_name, array $args = [])
    {
        $endpoint = call_user_func([$this, $method_name]);

        $request = Http::with_token($this->get_auth(), 'Basic');

        if (!empty($args['headers'])) {
            $request->with_headers($args['headers']);
        }

        $response = $request->with_body(wp_json_encode($payload))->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function get_auth()
    {
        if (empty($this->username) || empty($this->password)) {
            throw new InvalidArgumentException(__('Invalid Username Or Password.', 'kirki-ecommerce-klarna'));
        }
        return $this->username . ':' . $this->password;
    }

    protected function create_payment_session_id()
    {
        return $this->get_base_url() . KlarnaConstant::PAYMENT_SESSION;
    }

    public function get_base_url(): string
    {
        return KlarnaConstant::API_URLS[$this->region][$this->get_mode()] ?? null;
    }

    protected function get_mode()
    {
        return $this->sandbox ? KlarnaConstant::SANDBOX : KlarnaConstant::PRODUCTION;
    }

    protected function hhp_session_url()
    {
        return $this->get_base_url() . KlarnaConstant::HPP_SESSION;
    }

    public function get(string $method_name, string $args)
    {
        $endpoint = call_user_func([$this, $method_name], $args);

        $response = Http::with_token($this->get_auth(), 'Basic')
            ->get($endpoint . $args);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function order_management_url()
    {
        return $this->get_base_url() . KlarnaConstant::ORDER;
    }
}
