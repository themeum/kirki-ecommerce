<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\throw_unless;

defined('ABSPATH') || exit;

/**
 * PayFast payment gateway.
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
     * @throws Exception If the gateway is disabled or the form cannot be built.
     */
    public function pay(Order $order)
    {
        throw_unless(
            $this->enabled(),
            __('PayFast is not enabled.', 'kirki-ecommerce-payfast')
        );

        try {
            $builder = new PayfastTransactionBuilder($order);
            $checkout_fields = $builder->build_checkout_fields(
                $this->settings['merchant_id'],
                $this->settings['merchant_key'],
                $this->webhook_url()
            );

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => $this->get_client()->render_checkout_form($checkout_fields),
            ]);
        } catch (Exception $e) {
            /* translators: %s: Error message */
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
     * Handle a PayFast ITN callback.
     *
     * @return bool True if the notification was processed.
     * @throws Exception If the payload is invalid or the order lookup fails.
     */
    public function webhook()
    {
        try {
            $payload = $this->verify_and_parse_notification();

            $order_uuid = $payload['m_payment_id'] ?? '';
            throw_if(empty($order_uuid), __('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-payfast'));

            $order = OrderManager::find_by_uuid($order_uuid);
            throw_if(!$order, __('Webhook error: Order Not Found.', 'kirki-ecommerce-payfast'));

            if (PaymentStatus::PAID === $order->payment_status) {
                return true;
            }

            $this->handle_payment_response($order, $payload);

            return true;
        } catch (Throwable $th) {
            /* translators: %s: Error message */
            throw_anyway(sprintf(__('Webhook error: %s', 'kirki-ecommerce-payfast'), $th->getMessage()));
        }
    }

    /**
     * PayFast client, built from the saved settings on first use.
     *
     * @return PayfastClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PayfastClient
    {
        if ($this->client) {
            return $this->client;
        }

        $credentials = [
            'merchant_id' => $this->settings['merchant_id'] ?? '',
            'merchant_key' => $this->settings['merchant_key'] ?? '',
            'pass_phrase' => $this->settings['pass_phrase'] ?? '',
        ];

        throw_if(in_array('', $credentials, true), __('PayFast credentials are missing.', 'kirki-ecommerce-payfast'));

        $this->client = new PayfastClient($credentials['pass_phrase'], (bool) ($this->settings['sandbox'] ?? false));

        return $this->client;
    }

    /**
     * Read the ITN payload and verify it came from PayFast.
     *
     * @return array<string, string>
     * @throws Exception If the payload fails verification.
     */
    protected function verify_and_parse_notification(): array
    {
        $payload = Superglobals::post();

        throw_unless(
            $this->get_client()->is_verified($payload),
            __('Invalid Payload From PayFast.', 'kirki-ecommerce-payfast')
        );

        return $payload;
    }

    /**
     * Update the order to match the ITN's payment status.
     *
     * @param Order $order The local order.
     * @param array<string, string> $payload The verified ITN payload.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_payment_response(Order $order, array $payload): void
    {
        $status = PayfastConstant::PAYMENT_STATUS_MAP[$payload['payment_status'] ?? ''] ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    OrderManager::set_payment_provider_fee($order->id, $this->get_provider_fee($order, $payload));
                    break;

                case PaymentStatus::CANCELLED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                case PaymentStatus::UNPAID:
                    OrderManager::mark_payment_as_unpaid($order->id);
                    break;
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            /* translators: %s: Error message */
            throw_anyway(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-payfast'), $e->getMessage()));
        }
    }

    /**
     * Get PayFast's fee for the transaction, in minor units.
     *
     * PayFast reports amount_fee as a negative decimal amount.
     *
     * @param Order $order The local order.
     * @param array<string, string> $payload The verified ITN payload.
     * @return int
     */
    protected function get_provider_fee(Order $order, array $payload): int
    {
        return Money::to_minor(abs((float) ($payload['amount_fee'] ?? 0)), $order->currency_code);
    }

    /**
     * Record PayFast's payment ID and the raw ITN payload against the order.
     *
     * @param Order $order The local order.
     * @param array<string, string> $payload The verified ITN payload.
     * @return void
     */
    protected function record_transaction(Order $order, array $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload['pf_payment_id'] ?? '');
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
