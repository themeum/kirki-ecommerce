<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Stripe\Event;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Exception;
use Stripe\Webhook;
use UnexpectedValueException;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;

defined('ABSPATH') || exit;

class Stripe extends PaymentGateway
{
    /**
     * @var StripeClient
     */
    protected $stripe;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'stripe';
        $this->title = __('Stripe', 'kirki-ecommerce');
        $this->description = __('Stripe payment gateway', 'kirki-ecommerce');
        $this->icon = 'stripe';
        $this->settings_key = 'stripe';
        $this->is_manual = false;
        $this->has_fields = false;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret',
                'label' => __('Webhook Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return string
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Stripe is not enabled.', 'kirki-ecommerce'));
        }

        try {
            $stripe = $this->get_client();

            $line_items = [];
            $shipping_charge = [];
            $currency = strtoupper($order->currency_code);

            foreach ($order->items as $item) {
                $line_items[] = [
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => $item->product_name,
                            'description' => $this->get_item_description($item, $currency),
                        ],
                        'unit_amount' => (int) $item->invoiced_total,
                    ],
                    'quantity' => 1,
                ];
            }

            if (empty($line_items)) {
                $line_items[] = [
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => __('Order #' . $order->order_number, 'kirki-ecommerce'),
                        ],
                        'unit_amount' => (int) $order->invoiced_total,
                    ],
                    'quantity' => 1,
                ];
            }

            if (!empty($order->shipping_total)) {
                $shipping_charge[] = [
                    'shipping_rate_data' => [
                        'display_name' => 'Shipping Charge',
                        'type'         => 'fixed_amount',
                        'fixed_amount' => [
                            'amount'   => $order->shipping_total,
                            'currency' => $currency,
                        ],
                    ],
                ];
            }

            $metadata = [
                'order_id' => $order->id,
                'order_number' => $order->order_number
            ];

            // @todo Need to change success & cancel URL.
            $data = [
                'currency' => $currency,
                'line_items' => $line_items,
                'mode' => 'payment',
                'success_url' => $this->return_url($order) . '&action=success',
                'cancel_url' => $this->return_url($order) . '&action=cancel',
                'client_reference_id' => (string) $order->id,
                'metadata' => $metadata,
                'payment_intent_data' => [
                    'metadata' => $metadata,
                ],
                'shipping_options' => $shipping_charge
            ];

            if ($order->billing_email) {
                $data['customer_email'] = $order->billing_email;
            }

            $session = $stripe->checkout->sessions->create($data, ['idempotency_key' => 'checkout_' . $order->id]);

            return $session->url;
        } catch (Exception $e) {
            throw new Exception(__('Stripe Payment Error: ' . $e->getMessage(), 'kirki-ecommerce'));
        }
    }

    /**
     * Refund an order.
     *
     * @param Order $order
     * @param float|null $amount
     * @param string $reason
     * @return bool
     * @throws Exception
     */
    public function refund(Order $order, Refund $refund)
    {
        try {
            $stripe = $this->get_client();
            $transaction_id = $order->payment_transaction_id;

            if (empty($transaction_id)) {
                throw new Exception(__('No payment transaction ID found for this order.', 'kirki-ecommerce'));
            }

            $refund_payload = [
                'payment_intent' => $transaction_id,
                'amount' => (int) $refund->invoiced_amount,
                'metadata' => ['refund_request_id' => $refund->id],
            ];

            $refund = $stripe->refunds->create($refund_payload);

            if ($refund->status === 'succeeded' || $refund->status === 'pending') {
                return true;
            }

            throw new Exception(__('Refund failed.', 'kirki-ecommerce'));
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Stripe Refund Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Handle webhook event.
     *
     * @return bool
     */
    public function webhook()
    {
        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $endpoint_secret = $this->settings['webhook_secret'] ?? '';

        if (empty($endpoint_secret)) {
            throw new Exception(__('Webhook secret is not configured.', 'kirki-ecommerce'));
        }

        $event = null;

        DB::begin_transaction();

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );

            $this->handle_event($event);

            DB::commit();
        } catch (UnexpectedValueException $e) {
            DB::rollback();
            throw new Exception(__('Invalid payload', 'kirki-ecommerce'));
        } catch (SignatureVerificationException $e) {
            DB::rollback();
            throw new Exception(__('Invalid signature', 'kirki-ecommerce'));
        } catch (Exception $e) {
            DB::rollback();
            throw new Exception(__('Webhook error: ' . $e->getMessage(), 'kirki-ecommerce'));
        }

        return true;
    }

    /**
     * Get webhook events.
     *
     * @return array
     */
    public function webhook_events()
    {
        return WebhookEventType::get_constant_values();
    }

    /**
     * Save settings.
     *
     * @param array $settings
     * @return bool
     */
    public function save_settings(array $settings)
    {
        $webhook_secret = $settings['webhook_secret'] ?? null;

        if (empty($webhook_secret)) {
            $webhook_secret = $this->setup_webhook_endpoint();
            $settings['webhook_secret'] = $webhook_secret;
        }

        return parent::save_settings($settings);
    }

    /**
     * Validate settings.
     *
     * @param array $settings
     * @return bool
     */
    protected function validate_settings(array $settings)
    {
        Validator::make($settings, [
            'secret_key' => 'required|string',
            'webhook_secret' => 'nullable|string',
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
        $data = Sanitizer::make($settings, [
            'secret_key' => Sanitizer::TEXT,
            'webhook_secret' => Sanitizer::TEXT,
        ])->get_sanitized_data();

        return $data;
    }

    /**
     * Handle webhook event.
     *
     * @param Event $event
     * @return void
     */
    protected function handle_event(Event $event)
    {
        switch ($event->type) {
            case WebhookEventType::CHECKOUT_SESSION_COMPLETED:
                $session = $event->data->object;
                $this->handle_checkout_session_completed($session);
                break;
            case WebhookEventType::CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED:
                $session = $event->data->object;
                $this->handle_async_payment_succeeded($session);
                break;
            case WebhookEventType::CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED:
                $session = $event->data->object;
                $this->handle_async_payment_failed($session);
                break;
            case WebhookEventType::CHARGE_REFUNDED:
                $charge = $event->data->object;
                $this->handle_refunded($charge);
                break;
            case WebhookEventType::CHARGE_DISPUTE_CREATED:
                $dispute = $event->data->object;
                $this->handle_dispute_created($dispute);
                break;
            case WebhookEventType::CHARGE_DISPUTE_CLOSED:
                $dispute = $event->data->object;
                $this->handle_dispute_closed($dispute);
                break;

            case WebhookEventType::CHARGE_UPDATED:
                $charge = $event->data->object;
                $this->handle_charge_updated($charge);
                break;
            default:
                break;
        }
    }

    /**
     * Initialize Stripe Client.
     *
     * @return StripeClient
     * @throws Exception
     */
    protected function get_client()
    {
        if ($this->stripe) {
            return $this->stripe;
        }

        $secret_key = $this->settings['secret_key'] ?? null;

        if (empty($secret_key)) {
            throw new Exception(__('Stripe Secret Key is missing.', 'kirki-ecommerce'));
        }

        $this->stripe = new StripeClient($secret_key);

        return $this->stripe;
    }

    /**
     * Ensures a webhook exists for the given URL.
     * @return string
     */
    public function setup_webhook_endpoint()
    {
        $stripe = $this->get_client();

        $endpoints = $stripe->webhookEndpoints->all(['limit' => 16]);

        foreach ($endpoints->data as $endpoint) {
            if ($endpoint->url === $this->webhook_url() && $endpoint->status === 'enabled') {
                $stripe->webhookEndpoints->delete($endpoint->id, []);
            }
        }

        $new_endpoint = $stripe->webhookEndpoints->create([
            'url' => $this->webhook_url(),
            'enabled_events' => $this->webhook_events(),
            'description' => __('Kirki Ecommerce Webhook', 'kirki-ecommerce'),
        ]);

        return $new_endpoint->secret;
    }

    /**
     * Handle checkout.session.completed event.
     *
     * @param object $session
     */
    protected function handle_checkout_session_completed($session)
    {
        $order_id = $session->client_reference_id ?? ($session->metadata->order_id ?? null);

        if (!$order_id) {
            return;
        }

        $order = OrderManager::find($order_id);

        if (!$order) {
            return;
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return;
        }

        if ($session->payment_status === 'paid') {
            OrderManager::mark_payment_as_paid($order_id);
            OrderManager::mark_as_processing($order_id);
            OrderManager::set_payment_metadata($order_id, $session->toJson());
        } elseif ($session->payment_status === 'unpaid') {
            OrderManager::mark_payment_as_pending($order_id);
            OrderManager::mark_as_on_hold($order_id);
        }

        $payment_intent = $session->payment_intent;

        if ($payment_intent && empty($order->payment_transaction_id)) {
            OrderManager::set_transaction_id($order_id, $payment_intent);
        }
    }

    /**
     * Handle checkout.session.async_payment_succeeded event.
     *
     * This is triggered when an async payment method (SEPA, ACH, etc.) succeeds.
     *
     * @param object $session
     */
    protected function handle_async_payment_succeeded($session)
    {
        $order_id = $session->client_reference_id ?? ($session->metadata->order_id ?? null);

        if (!$order_id) {
            return;
        }

        $order = OrderManager::find($order_id);

        if (!$order) {
            return;
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return;
        }

        OrderManager::mark_payment_as_paid($order_id);
        OrderManager::mark_as_processing($order_id);
        OrderManager::set_payment_metadata($order_id, $session->toJson());
    }

    /**
     * Handle checkout.session.async_payment_failed event.
     *
     * This is triggered when an async payment method (SEPA, ACH, etc.) fails.
     *
     * @param object $session
     */
    protected function handle_async_payment_failed($session)
    {
        $order_id = $session->client_reference_id ?? ($session->metadata->order_id ?? null);

        if (!$order_id) {
            return;
        }

        $order = OrderManager::find($order_id);

        if (!$order) {
            return;
        }

        OrderManager::mark_payment_as_failed($order_id);
        OrderManager::mark_as_cancelled($order_id);
        OrderManager::set_payment_metadata($order_id, $session->toJson());
    }

    /**
     * Handle charge.dispute.created event.
     *
     * This is triggered when a customer disputes a charge (chargeback).
     *
     * @param object $dispute
     */
    protected function handle_dispute_created($dispute)
    {
        $payment_intent = $dispute->payment_intent;

        if (!$payment_intent) {
            return;
        }

        $order = OrderManager::find_by_transaction_id($payment_intent);

        if (!$order) {
            return;
        }

        OrderManager::mark_as_on_hold($order->id);
        OrderManager::mark_payment_as_on_hold($order->id);
    }

    /**
     * Handle charge.dispute.closed event.
     *
     * This is triggered when a dispute is resolved (won or lost).
     *
     * @param object $dispute
     */
    protected function handle_dispute_closed($dispute)
    {
        $payment_intent = $dispute->payment_intent;

        if (!$payment_intent) {
            return;
        }

        $order = OrderManager::find_by_transaction_id($payment_intent);

        if (!$order) {
            return;
        }

        if ($dispute->status === 'won' && $order->payment_status === PaymentStatus::PAID) {
            OrderManager::mark_as_processing($order->id);
        }

        if ($dispute->status === 'lost') {
            OrderManager::mark_payment_as_refunded($order->id);
            OrderManager::mark_as_refunded($order->id);
        }
    }

    /**
     * Handle charge.refunded event.
     *
     * @param object $charge
     */
    protected function handle_refunded($charge)
    {
        $payment_intent = $charge->payment_intent;

        if (!$payment_intent) {
            return;
        }

        $order = OrderManager::find_by_transaction_id($payment_intent);

        if (!$order) {
            return;
        }

        $charge = $this->get_client()->charges->retrieve($charge->id, [
            'expand' => ['refunds']
        ]);

        $stripe_refund = $charge->refunds->data[0];
        $refund = OrderManager::get_refund($order, $stripe_refund->metadata->refund_request_id);

        if (!$refund) {
            return;
        }

        OrderManager::update_refund(UpdateRefundPayloadDTO::from_array(array_merge($refund->to_array(), [
            'invoiced_amount' => $stripe_refund->amount,
            'refund_id' => $stripe_refund->id,
            'status' => $stripe_refund->status === 'succeeded' ? RefundStatus::COMPLETED : RefundStatus::PENDING,
        ])));
    }

    /**
     * Handle charge.succeeded event.
     *
     * @param object $charge
     */
    protected function handle_charge_updated($charge)
    {
        $charge = $this->get_client()->charges->retrieve($charge->id, [
            'expand' => ['balance_transaction']
        ]);

        $balance_transaction = $charge->balance_transaction;

        if (empty($balance_transaction)) {
            return;
        }

        $order = OrderManager::find_by_transaction_id($charge->payment_intent);

        if (!$order) {
            return;
        }

        OrderManager::set_payment_gateway_fee($order->id, $balance_transaction->fee);
    }
}
