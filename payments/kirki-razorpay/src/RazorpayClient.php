<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

defined('ABSPATH') || exit;

/**
 * HTTP client for the Razorpay Payments API.
 */
class RazorpayClient
{
    protected $key_id;
    protected $key_secret;
    protected $test_mode;
    protected $webhook_secret;

    public function __construct(string $key_id, string $key_secret, string $webhook_secret)
    {
        $this->key_id = $key_id;
        $this->key_secret = $key_secret;
        $this->webhook_secret = $webhook_secret;
    }

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

    protected function get_auth()
    {
        if (empty($this->key_id) || empty($this->key_secret)) {
            throw new InvalidArgumentException(__('Invalid API Key Or Key Secret.', 'kirki-razorpay'));
        }
        return base64_encode($this->key_id . ':' . $this->key_secret);
    }

    public function render_checkout_form(Order $order, string $razorpay_order_id, string $success_url): string
    {
        $options = [
            'key' => $this->key_id,
            'amount' => $order->invoiced_total,
            'currency' => strtoupper($order->currency_code),
            'order_id' => $razorpay_order_id,
            'callback_url' => $success_url,
            'prefill' => [
                'name' => trim($order->billing_first_name . ' ' . $order->billing_last_name),
                'email' => $order->billing_email,
                'contact' => $order->billing_phone,
            ],
            'notes' => [
                'order_id' => $order->id,
            ],
            'modal' => [
                'escape' => false,
                'confirm_close' => true,
            ],
        ];

        $script_url = esc_url(RazorpayConstant::JS_SCRIPT);
        $options_json = wp_json_encode($options);

        return <<<HTML
        <script src="{$script_url}"></script>
        <script>
            var razorpay = new Razorpay({$options_json});
            razorpay.open();
        </script>
        HTML;
    }

    public function is_verified(string $raw_payload): bool
    {
        $given_signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
        $expected_signature = hash_hmac(RazorpayConstant::SHA256, $raw_payload, $this->webhook_secret);

        return hash_equals($expected_signature, $given_signature);
    }
}
