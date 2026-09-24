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

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\throw_unless;

defined('ABSPATH') || exit;

/**
 * PayMongo payment gateway.
 */
class Payfast extends PaymentProvider
{
    protected ?PayfastClient $client = null;


    public function __construct()
    {
        $this->id = 'payfast';
        $this->title = __('PayFast', 'kirki-ecommerce-payfast');
        $this->description = __('PayFast Payment Gateway', 'kirki-ecommerce-payfast');
        $this->icon = $this->icon_url('payfast');
        $this->settings_key = 'payfast';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'merchant_id',
                'label' => __('Merchant ID', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'merchant_key',
                'label' => __('Merchant Key', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'pass_phrase',
                'label' => __('Passphrase', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-payfast'),
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
        throw_unless(
            $this->enabled(),
            __('PayFast is not enabled.', 'kirki-ecommerce-payfast')
        );

        try {
            $builder = new PaymongoTransactionBuilder($order);


            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => '',
            ]);
        } catch (Exception $e) {
            throw_anyway(sprintf(__('PayFast Payment Error: %s', 'kirki-ecommerce-payfast'), $e->getMessage()));
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
            'merchant_id' => 'sometimes|string',
            'merchant_key' => 'sometimes|string',
            'pass_phrase' => 'sometimes|string',
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
            'merchant_id' => Sanitizer::TEXT,
            'merchant_key' => Sanitizer::TEXT,
            'pass_phrase' => Sanitizer::TEXT,
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

            if (!in_array($event->type, static::HANDLED_EVENTS, true)) {
                return false;
            }

            // Checkout sessions carry the order UUID as their reference number; payments only
            // carry the metadata PayMongo copies over from the session that created them.
            $attributes = $event->data->attributes ?? null;
            $order_uuid = (string) ($attributes->metadata->order_id ?? $attributes->reference_number ?? '');

            throw_if(empty($order_uuid), __('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-paymongo'));

            $order = OrderManager::find_by_uuid($order_uuid);
            throw_if(!$order, __('Webhook error: Order Not Found.', 'kirki-ecommerce-paymongo'));

            if (PaymentStatus::PAID === $order->payment_status) {
                return true;
            }

            $this->apply_payment_event($order, $event);

            return true;
        } catch (Throwable $th) {
            throw_anyway(sprintf(__('Webhook error: %s', 'kirki-ecommerce-paymongo'), $th->getMessage()));
        }
    }

    /**
     * PayMongo API client, built from the saved settings on first use.
     *
     * @return PayfastClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PayfastClient
    {
        if ($this->client) {
            return $this->client;
        }

        $merchant_id = $this->settings['merchant_id'] ?? '';
        $merchant_key = $this->settings['merchant_key'] ?? '';
        $pass_phrase = $this->settings['pass_phrase'] ?? '';

        if (empty($merchant_id) || empty($merchant_key) || empty($pass_phrase)) {
            throw_anyway(__('PayMongo credentials are missing.', 'kirki-ecommerce-payfast'));
        }

        $this->client = new PayfastClient(
            $secret_key,
            $webhook_secret_key,
            $pass_phrase,
            (bool) ($this->settings['sandbox'])
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

            if (in_array($event->type, static::PAID_EVENTS, true)) {
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

            throw_anyway(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-paymongo'), $e->getMessage()));
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
            throw_anyway(__('Invalid Payload From PayMongo.', 'kirki-ecommerce-paymongo'));
        }

        $payload = json_decode($raw_payload);
        $event = $payload->data->attributes ?? null;

        if (!is_object($event) || empty($event->type) || !isset($event->data)) {
            throw_anyway(__('Invalid Payload From PayMongo.', 'kirki-ecommerce-paymongo'));
        }

        return $event;
    }
}
