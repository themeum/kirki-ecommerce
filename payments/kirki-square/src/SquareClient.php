<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Razorpay Payments API.
 */
class SquareClient
{
    protected $location_id;
    protected $access_token;
    protected $sandbox;
    protected $signature_key;

    /**
     * @param string $location_id
     * @param string $access_token
     * @param string $signature_key
     */
    public function __construct(string $location_id, string $access_token, string $signature_key, bool $sandbox = false)
    {
        $this->location_id = $location_id;
        $this->access_token = $access_token;
        $this->signature_key = $signature_key;
        $this->sandbox = $sandbox;
    }

    /**
     * Send a POST request to the Razorpay API.
     *
     * @param array $payload
     * @param string $endpoint
     * @return mixed Decoded JSON response.
     * @throws Exception If the request fails.
     */
    public function post(array $payload, string $endpoint)
    {
        $response = Http::with_token($this->get_auth(), 'Basic')
            ->with_body(wp_json_encode($payload))
            ->post($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }


    public function is_verified(string $raw_payload, string $webhook_url): bool
    {
        $given_signature = $_SERVER['HTTP_X_SQUARE_HMACSHA256_SIGNATURE'] ?? $_SERVER['HTTP_X_SQUARE_SIGNATURE'] ?? '';

        if (empty(strlen($raw_payload)) || empty(strlen($given_signature))) {
            return false;
        }

        $payload =  $webhook_url . $raw_payload;

        $hash = hash_hmac('sha256', $payload, $this->signature_key, true);
        $expected_signature = base64_encode($hash);

        return $expected_signature === $given_signature;
    }

    public function send(string $endpoint, string $method, array $payload = [])
    {
        $request = Http::with_token($this->access_token)
                    ->with_headers(['Square-Version' => SquareConstant::SQUARE_VERSION]);

        $response = SquareConstant::POST_METHOD === $method
            ? $request->with_body(wp_json_encode($payload))->post($endpoint)
            : $request->get($endpoint);

        if ($response->failed()) {
            throw new Exception($response->body());
        }

        return $response->json();
    }

    protected function payment_link_url(): string
    {
        return $this->get_base_url() . SquareConstant::PAYMENT_LINK;
    }

    public function create_payment_link(array $payload)
    {
        return $this->send($this->payment_link_url(), SquareConstant::POST_METHOD, $payload);
    }

    public function fetch_square_ref_id(string $order_id)
    {
        return $this->send($this->retrieve_order_url($order_id), SquareConstant::GET_METHOD);
    }

    protected function retrieve_order_url(string $order_id)
    {
        return $this->get_base_url() . SquareConstant::ORDER_LINK . "/{$order_id}";
    }

    protected function get_base_url()
    {
        return  $this->sandbox ? SquareConstant::SANDBOX_BASE_URL : SquareConstant::PRODUCTION_BASE_URL;
    }
}
