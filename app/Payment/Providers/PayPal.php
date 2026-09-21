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
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * Payment provider for PayPal checkout, using the PayPal orders REST API.
 *
 * @since 1.0.0
 */
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
     * Set up PayPal's identity and admin fields.
     *
     * @since 1.0.0
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
                'default' => '',
                'placeholder' => __('Enter your client ID', 'kirki-ecommerce'),
            ],
            [
                'name' => 'client_secret',
                'label' => __('Client Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
                'default' => '',
                'placeholder' => __('Enter your client secret', 'kirki-ecommerce'),
            ],
            [
                'name' => 'webhook_id',
                'label' => __('Webhook ID', 'kirki-ecommerce'),
                'type' => 'text',
                'description' => __('Create a webhook in PayPal Developer Dashboard for events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED', 'kirki-ecommerce'),
                'required' => true,
                'default' => '',
                'placeholder' => __('Enter your webhook ID', 'kirki-ecommerce'),
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce'),
                'type' => 'checkbox',
                'default' => true,
                'description' => __('Enable sandbox mode to test the payment gateway.', 'kirki-ecommerce'),
            ],
        ]);
    }

    /**
     * Get the PayPal API base URL for the configured mode.
     *
     * Returns the sandbox URL when sandbox mode is on, the live URL otherwise.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_base_url()
    {
        return ($this->settings['sandbox'] ?? false) ? static::SANDBOX_URL : static::LIVE_URL;
    }

    /**
     * Request an OAuth access token from PayPal.
     *
     * @since 1.0.0
     *
     * @return string
     * @throws Exception When PayPal is disabled, the credentials are missing or authentication fails.
     */
    protected function get_access_token()
    {
        throw_if(!$this->enabled(), __('PayPal is not enabled.', 'kirki-ecommerce'));

        $client_id = $this->settings['client_id'] ?? '';
        $client_secret = $this->settings['client_secret'] ?? '';

        throw_if(empty($client_id) || empty($client_secret), __('PayPal Client ID or Secret is missing.', 'kirki-ecommerce'));

        $response = Http::with_headers([
            'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
        ])->as_form()->post(
            $this->get_base_url() . '/v1/oauth2/token',
            [
                'grant_type' => 'client_credentials',
            ]
        );

        /* translators: %s: PayPal API error response */
        throw_if($response->failed(), sprintf(__('Failed to authenticate with PayPal: %s', 'kirki-ecommerce'), $response->body()));

        $data = $response->json();

        return $data['access_token'];
    }

    /**
     * Create a PayPal order and return its approval redirect.
     *
     * @since 1.0.0
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception When the PayPal order cannot be created or has no approve link.
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
                        'value' => $this->format_amount($item->invoiced_total, $currency),
                    ],
                ];
            }

            $purchase_units = [
                [
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => $this->format_amount($order->invoiced_total, $currency),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => $currency,
                                'value' => $this->format_amount($order->invoiced_total - $order->invoiced_shipping_total, $currency),
                            ],
                            'shipping' => [
                                'currency_code' => $currency,
                                'value' => $this->format_amount($order->invoiced_shipping_total, $currency),
                            ],
                        ],
                    ],
                    'custom_id' => (string) $order->id,
                    'invoice_id' => (string) $order->order_number,
                    /* translators: %s: order number */
                    'description' => sprintf(__('Order #%s', 'kirki-ecommerce'), $order->order_number),
                    'items' => $items,
                ]
            ];

            $response = Http::with_token($token)
                ->as_json()
                ->post($this->get_base_url() . '/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'purchase_units' => $purchase_units,
                    'application_context' => [
                        'return_url' => Url::get_checkout_success_url($order->uuid),
                        'cancel_url' => Url::get_checkout_failed_url($order->uuid),
                        'brand_name' => get_bloginfo('name'),
                        'user_action' => 'PAY_NOW',
                    ],
                ]);

            /* translators: %s: PayPal API error response */
            throw_if($response->failed(), sprintf(__('Failed to create PayPal order: %s', 'kirki-ecommerce'), $response->body()));

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

            throw_anyway(__('PayPal approve link not found.', 'kirki-ecommerce'));
        } catch (Exception $e) {
            /* translators: %s: underlying error message */
            throw_anyway(sprintf(__('PayPal Payment Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Refund a captured PayPal payment for an order.
     *
     * @since 1.0.0
     *
     * @param Order  $order
     * @param Refund $refund
     * @return bool True when PayPal accepted the refund.
     * @throws Exception When the order has no transaction ID or the refund request fails.
     */
    public function refund(Order $order, Refund $refund)
    {
        try {
            $token = $this->get_access_token();
            $transaction_id = $order->payment_transaction_id;

            throw_if(empty($transaction_id), __('No payment transaction ID found for this order.', 'kirki-ecommerce'));

            $currency = strtoupper($order->currency_code);

            $response = Http::with_token($token)
                ->as_json()
                ->post($this->get_base_url() . "/v2/payments/captures/{$transaction_id}/refund", [
                    'amount' => [
                        'value' => $this->format_amount($refund->invoiced_amount, $currency),
                        'currency_code' => $currency,
                    ],
                    'note_to_payer' => $refund->reason,
                    'custom_id' => (string) $refund->id,
                ]);

            /* translators: %s: PayPal API error response */
            throw_if($response->failed(), sprintf(__('PayPal Refund Error: %s', 'kirki-ecommerce'), $response->body()));

            return true;
        } catch (Exception $e) {
            /* translators: %s: underlying error message */
            throw_anyway(sprintf(__('PayPal Refund Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Capture an approved PayPal order.
     *
     * @since 1.0.0
     *
     * @param string $order_id PayPal order ID.
     * @return array<string, mixed> Decoded PayPal capture response.
     * @throws Exception When authentication or the capture request fails.
     */
    protected function capture_order($order_id)
    {
        $token = $this->get_access_token();

        $response = Http::with_token($token)
            ->as_json()
            ->post($this->get_base_url() . "/v2/checkout/orders/{$order_id}/capture");

        /* translators: %s: PayPal API error response */
        throw_if($response->failed(), sprintf(__('Failed to capture PayPal order: %s', 'kirki-ecommerce'), $response->body()));

        return $response->json();
    }

    /**
     * Handle a PayPal webhook event.
     *
     * Dispatches CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED and
     * PAYMENT.CAPTURE.REFUNDED events; other event types are ignored.
     *
     * @since 1.0.0
     *
     * @return bool False when the payload is empty or invalid, or handling threw.
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

    /**
     * Capture the PayPal order once the buyer has approved it.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $event Decoded webhook payload.
     * @return void
     */
    protected function handle_checkout_order_approved($event)
    {
        $resource = $event['resource'];
        $order_id = $resource['id'] ?? null;

        if (!$order_id) {
            return;
        }

        $this->capture_order($order_id);
    }

    /**
     * Mark the matching order as paid after PayPal reports a completed capture.
     *
     * Finds the order by PayPal order ID, falling back to the custom ID, then
     * stores the capture ID, payment metadata and PayPal fee.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $event Decoded webhook payload.
     * @return void
     */
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
            OrderManager::set_payment_metadata($order->id, wp_json_encode($resource));
        }

        $this->capture_payment_provider_fee($order, $resource);
    }

    /**
     * Store PayPal's fee on the order when it is in the order's currency.
     *
     * @since 1.0.0
     *
     * @param Order                $order
     * @param array<string, mixed> $resource Capture resource from the webhook payload.
     * @return void
     */
    protected function capture_payment_provider_fee(Order $order, array $resource)
    {
        $fee = $resource['seller_receivable_breakdown']['paypal_fee'] ?? null;

        if (!$fee || !isset($fee['value'], $fee['currency_code'])) {
            return;
        }

        if (strtoupper($fee['currency_code']) !== strtoupper($order->currency_code)) {
            return;
        }

        OrderManager::set_payment_provider_fee($order->id, Money::to_minor($fee['value'], $order->currency_code));
    }

    /**
     * Update the matching refund after PayPal reports a refunded capture.
     *
     * Finds the order through the capture ID linked from the event and the
     * refund through its custom ID, then marks the refund completed or pending
     * to match PayPal's status.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $event Decoded webhook payload.
     * @return void
     */
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
     * Validate the PayPal settings.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $settings
     * @return bool
     * @throws \Kirki\Ecommerce\Framework\Exceptions\ValidationException When a setting has the wrong type.
     */
    protected function validate_settings(array $settings)
    {
        parent::validate_settings($settings);

        Validator::make($settings, [
            'client_id' => 'sometimes|string',
            'client_secret' => 'sometimes|string',
            'webhook_id' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize the PayPal settings on top of the parent's.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
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
}
