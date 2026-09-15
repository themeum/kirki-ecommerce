<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

defined('ABSPATH') || exit;

/**
 * PayMongo payment gateway.
 */
class Paymongo extends PaymentProvider
{
    protected ?PaymongoClient $client = null;

    public function __construct()
    {
        $this->id = 'paymongo';
        $this->title = __('PayMongo', 'kirki-ecommerce-paymongo');
        $this->description = __('PayMongo Payment Gateway', 'kirki-ecommerce-paymongo');
        $this->icon = $this->icon_url('paymongo');
        $this->settings_key = 'paymongo';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce-paymongo'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret_key',
                'label' => __('Webhook Secret Key', 'kirki-ecommerce-paymongo'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-paymongo'),
                'type' => 'checkbox',
            ],
        ]);
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
        if (!$this->enabled()) {
            throw new Exception(__('PayMongo is not enabled.', 'kirki-ecommerce-paymongo'));
        }

        if (PaymongoConstant::CURRENCY !== strtoupper((string) $order->currency_code)) {
            throw new Exception(__('PayMongo only accepts payments in Philippine pesos (PHP).', 'kirki-ecommerce-paymongo'));
        }

        try {
            $builder = new PaymongoTransactionBuilder($order);
            $response = $this->get_client()->create_checkout_session($builder->create_checkout_session_payload(), $order->uuid);
            $checkout_url = $response['data']['attributes']['checkout_url'] ?? '';

            if (empty($checkout_url)) {
                throw new Exception(__('PayMongo Checkout Url Not Found.', 'kirki-ecommerce-paymongo'));
            }

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $checkout_url,
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayMongo Payment Error: %s', 'kirki-ecommerce-paymongo'), $e->getMessage()));
        }
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
            'secret_key' => 'sometimes|string',
            'webhook_secret_key' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
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
            'secret_key' => Sanitizer::TEXT,
            'webhook_secret_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a PayMongo webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the order lookup fails.
     */
    public function webhook()
    {
        http_response_code(200);

        try {
            $event = $this->read_verified_event();

            if (!in_array($event->type, PaymongoConstant::HANDLED_EVENTS, true)) {
                return false;
            }

            // Checkout sessions carry the order UUID as their reference number; payments only
            // carry the metadata PayMongo copies over from the session that created them.
            $attributes = $event->data->attributes ?? null;
            $order_uuid = (string) ($attributes->metadata->order_id ?? $attributes->reference_number ?? '');

            if (empty($order_uuid)) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-paymongo'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);

            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-paymongo'));
            }

            if (PaymentStatus::PAID === $order->payment_status) {
                return true;
            }

            $this->apply_payment_event($order, $event);

            return true;
        } catch (Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-paymongo'), $th->getMessage()));
        }
    }

    /**
     * PayMongo API client, built from the saved settings on first use.
     *
     * @return PaymongoClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PaymongoClient
    {
        if ($this->client) {
            return $this->client;
        }

        $secret_key = $this->settings['secret_key'] ?? '';
        $webhook_secret_key = $this->settings['webhook_secret_key'] ?? '';

        if (empty($secret_key) || empty($webhook_secret_key)) {
            throw new Exception(__('PayMongo credentials are missing.', 'kirki-ecommerce-paymongo'));
        }

        $this->client = new PaymongoClient(
            $secret_key,
            $webhook_secret_key,
            (bool) ($this->settings['sandbox'] ?? true)
        );

        return $this->client;
    }

    /**
     * Apply a verified PayMongo webhook event to the local order.
     *
     * @param Order $order The local order.
     * @param object $event The event's attributes, as returned by read_verified_event().
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function apply_payment_event(Order $order, object $event): void
    {
        $resource = $event->data;
        $payment = $this->find_payment($resource);

        DB::begin_transaction();

        try {
            OrderManager::set_transaction_id($order->id, (string) ($payment->id ?? $resource->id));
            OrderManager::set_payment_metadata($order->id, wp_json_encode($resource));

            if (in_array($event->type, PaymongoConstant::PAID_EVENTS, true)) {
                OrderManager::mark_payment_as_paid($order->id);

                $fee = (int) ($payment->attributes->fee ?? 0);

                if ($fee > 0) {
                    OrderManager::set_payment_provider_fee($order->id, $fee);
                }
            } else {
                OrderManager::mark_payment_as_failed($order->id);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-paymongo'), $e->getMessage())
            );
        }
    }

    /**
     * Locate the payment resource an event carries.
     *
     * `payment.*` events carry it directly; `checkout_session.*` events nest it under the session.
     *
     * @param object $resource The resource the event carries.
     * @return object|null Null when the resource carries no payment.
     */
    protected function find_payment(object $resource): ?object
    {
        if (PaymongoConstant::RESOURCE_PAYMENT === ($resource->type ?? '')) {
            return $resource;
        }

        return $resource->attributes->payments[0] ?? null;
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode the event it describes.
     *
     * @return object The event's attributes: its `type` and the `data` resource it carries.
     * @throws Exception If the payload is missing, unverified, or malformed.
     */
    protected function read_verified_event(): object
    {
        $raw_payload = file_get_contents('php://input');

        if (empty($raw_payload) || !$this->get_client()->is_verified($raw_payload)) {
            throw new Exception(__('Invalid Payload From PayMongo.', 'kirki-ecommerce-paymongo'));
        }

        $payload = json_decode($raw_payload);
        $event = $payload->data->attributes ?? null;

        if (!is_object($event) || empty($event->type) || !isset($event->data)) {
            throw new Exception(__('Invalid Payload From PayMongo.', 'kirki-ecommerce-paymongo'));
        }

        return $event;
    }
}
