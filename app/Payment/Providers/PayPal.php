<?php

namespace Kirki\Ecommerce\App\Payment\Providers;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Exception;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

class PayPal extends PaymentProvider
{
    /**
     * API Base URL for Sandbox.
     */
    const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';

    /**
     * API Base URL for Live.
     */
    const LIVE_URL = 'https://api-m.paypal.com';

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'paypal';
        $this->title = __('PayPal', 'kirki-ecommerce');
        $this->description = __('PayPal payment gateway', 'kirki-ecommerce');
        $this->icon = app()->base_url('/app/Payment/Providers/logo.svg');
        $this->settings_key = 'paypal';
        $this->is_offline = false;
        $this->has_fields = false;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'client_id',
                'label' => __('Client ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'client_secret',
                'label' => __('Client Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_id',
                'label' => __('Webhook ID', 'kirki-ecommerce'),
                'type' => 'text',
                'description' => __('Create a webhook in PayPal Developer Dashboard for events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED', 'kirki-ecommerce'),
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Get API Base URL.
     * 
     * @return string
     */
    protected function get_base_url()
    {
        return ($this->settings['sandbox'] ?? false) ? static::SANDBOX_URL : static::LIVE_URL;
    }

    /**
     * Get Access Token.
     * 
     * @return string
     * @throws Exception
     */
    protected function get_access_token()
    {
        if (!$this->enabled()) {
            throw new Exception(__('PayPal is not enabled.', 'kirki-ecommerce'));
        }

        $client_id = $this->settings['client_id'] ?? '';
        $client_secret = $this->settings['client_secret'] ?? '';

        if (empty($client_id) || empty($client_secret)) {
            throw new Exception(__('PayPal Client ID or Secret is missing.', 'kirki-ecommerce'));
        }

        $response = Http::with_headers([
            'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
        ])->as_form()->post(
            $this->get_base_url() . '/v1/oauth2/token',
            [
                'grant_type' => 'client_credentials',
            ]
        );

        if ($response->failed()) {
            throw new Exception(sprintf(__('Failed to authenticate with PayPal: %s', 'kirki-ecommerce'), $response->body()));
        }

        $data = $response->json();

        return $data['access_token'];
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception
     */
    public function pay(Order $order)
    {
        try {
            $token = $this->get_access_token();
            $currency = strtoupper($order->currency_code);

            $items = [];

            foreach ($order->items as $item) {
                $items[] = [
                    'name' => $item->product_name,
                    'description' => $this->get_item_description($item, $currency),
                    'quantity' => 1,
                    'unit_amount' => [
                        'currency_code' => $currency,
                        'value' => $this->format_amount($item->invoiced_total),
                    ],
                ];
            }

            $purchase_units = [
                [
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => $this->format_amount($order->invoiced_total),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => $currency,
                                'value' => $this->format_amount($order->invoiced_total - $order->invoiced_shipping_total),
                            ],
                            'shipping' => [
                                'currency_code' => $currency,
                                'value' => $this->format_amount($order->invoiced_shipping_total),
                            ],
                        ],
                    ],
                    'custom_id' => (string) $order->id,
                    'invoice_id' => (string) $order->order_number,
                    'description' => sprintf(__('Order #%s', 'kirki-ecommerce'), $order->order_number),
                    'items' => $items,
                ]
            ];

            $return_url = $this->return_url($order);

            $response = Http::with_token($token)
                ->as_json()
                ->post($this->get_base_url() . '/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'purchase_units' => $purchase_units,
                    'application_context' => [
                        'return_url' => $return_url . '&action=success',
                        'cancel_url' => $return_url . '&action=cancel',
                        'brand_name' => get_bloginfo('name'),
                        'user_action' => 'PAY_NOW',
                    ],
                ]);

            if ($response->failed()) {
                throw new Exception(sprintf(__('Failed to create PayPal order: %s', 'kirki-ecommerce'), $response->body()));
            }

            $order_data = $response->json();

            OrderManager::set_transaction_id($order->id, $order_data['id']);

            foreach ($order_data['links'] as $link) {
                if ($link['rel'] === 'approve') {
                    return PaymentActionDTO::from_array([
                        'type' => PaymentActionType::REDIRECT,
                        'value' => $link['href'],
                    ]);
                }
            }

            throw new Exception(__('PayPal approve link not found.', 'kirki-ecommerce'));
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayPal Payment Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Refund an order.
     *
     * @param Order $order
     * @param Refund $refund
     * @return bool
     * @throws Exception
     */
    public function refund(Order $order, Refund $refund)
    {
        try {
            $token = $this->get_access_token();
            $transaction_id = $order->payment_transaction_id;

            if (empty($transaction_id)) {
                throw new Exception(__('No payment transaction ID found for this order.', 'kirki-ecommerce'));
            }

            $currency = strtoupper($order->currency_code);

            $response = Http::with_token($token)
                ->as_json()
                ->post($this->get_base_url() . "/v2/payments/captures/{$transaction_id}/refund", [
                    'amount' => [
                        'value' => $this->format_amount($refund->invoiced_amount),
                        'currency_code' => $currency,
                    ],
                    'note_to_payer' => $refund->reason,
                    'custom_id' => (string) $refund->id,
                ]);

            if ($response->failed()) {
                throw new Exception(sprintf(__('PayPal Refund Error: %s', 'kirki-ecommerce'), $response->body()));
            }

            return true;
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayPal Refund Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Capture PayPal Order.
     * 
     * @param string $order_id
     * @return array
     * @throws Exception
     */
    protected function capture_order($order_id)
    {
        $token = $this->get_access_token();

        $response = Http::with_token($token)
            ->as_json()
            ->post($this->get_base_url() . "/v2/checkout/orders/{$order_id}/capture");

        if ($response->failed()) {
            throw new Exception(sprintf(__('Failed to capture PayPal order: %s', 'kirki-ecommerce'), $response->body()));
        }

        return $response->json();
    }

    /**
     * Handle webhook event.
     *
     * @return bool
     */
    public function webhook()
    {
        $payload = @file_get_contents('php://input');
        $event = json_decode($payload, true);

        if (!$event) {
            return false;
        }

        $event_type = $event['event_type'] ?? '';

        try {
            switch ($event_type) {
                case 'CHECKOUT.ORDER.APPROVED':
                    $this->handle_checkout_order_approved($event);
                    break;
                case 'PAYMENT.CAPTURE.COMPLETED':
                    $this->handle_payment_capture_completed($event);
                    break;
                case 'PAYMENT.CAPTURE.REFUNDED':
                    $this->handle_payment_capture_refunded($event);
                    break;
            }
        } catch (Exception $e) {
            return false;
        }

        return true;
    }

    protected function handle_checkout_order_approved($event)
    {
        $resource = $event['resource'];
        $order_id = $resource['id'] ?? null;

        if (!$order_id) {
            return;
        }

        $this->capture_order($order_id);
    }

    protected function handle_payment_capture_completed($event)
    {
        $resource = $event['resource'];
        $paypal_order_id = $resource['supplementary_data']['related_ids']['order_id'] ?? null;

        if (!$paypal_order_id) {
            return;
        }

        $order = OrderManager::find_by_transaction_id($paypal_order_id);

        if (!$order && !empty($resource['custom_id'])) {
            $order = OrderManager::find($resource['custom_id']);
        }

        if (!$order) {
            return;
        }

        OrderManager::set_transaction_id($order->id, $resource['id']);

        if ($order->payment_status !== PaymentStatus::PAID) {
            OrderManager::mark_payment_as_paid($order->id);
            OrderManager::mark_as_processing($order->id);
        }
    }

    protected function handle_payment_capture_refunded($event)
    {
        $resource = $event['resource'];

        $capture_id = null;

        foreach (($resource['links'] ?? []) as $link) {
            if ($link['rel'] === 'up') {
                $parts = explode('/', rtrim($link['href'], '/'));
                $capture_id = end($parts);
                break;
            }
        }

        $order = $capture_id ? OrderManager::find_by_transaction_id($capture_id) : null;

        if (!$order) {
            return;
        }

        $refund_request_id = $resource['custom_id'] ?? null;

        if (!$refund_request_id) {
            return;
        }

        $refund = OrderManager::get_refund($order, $refund_request_id);

        if (!$refund) {
            return;
        }

        $paypal_status = $resource['status'] ?? '';
        $resolved_status = $paypal_status === 'COMPLETED' ? RefundStatus::COMPLETED : RefundStatus::PENDING;

        OrderManager::update_refund(UpdateRefundPayloadDTO::from_array(array_merge($refund->to_array(), [
            'invoiced_amount' => $refund->invoiced_amount,
            'refund_id' => $resource['id'],
            'status' => $resolved_status,
        ])));
    }

    /**
     * Validate settings.
     *
     * @param array $settings
     * @return bool
     */
    protected function validate_settings(array $settings)
    {
        parent::validate_settings($settings);

        Validator::make($settings, [
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
            'webhook_id' => 'required|string',
            'sandbox' => 'boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize settings.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'client_id' => Sanitizer::TEXT,
            'client_secret' => Sanitizer::TEXT,
            'webhook_id' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Format amount.
     *
     * @param int $amount
     * @return string
     */
    protected function format_amount($amount)
    {
        return number_format(Money::from_minor($amount)->getAmount()->toFloat(), 2, '.', '');
    }
}
