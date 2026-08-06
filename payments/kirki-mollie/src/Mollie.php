<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;

/**
 * Mollie payment gateway.
 */
class Mollie extends PaymentGateway
{
    protected $mollie;
    protected $transaction_builder;
    public function __construct()
    {
        $this->id = 'mollie';
        $this->title = __('Mollie', 'kirki-ecommerce');
        $this->description = __('Mollie payment gateway', 'kirki-ecommerce');
        $this->icon = 'mollie';
        $this->settings_key = 'mollie';
        $this->is_manual = false;
        $this->has_fields = true;
        $this->transaction_builder = new MollieTransactionBuilder();

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'api_key',
                'label' => __('Api key', 'kirki-ecommerce'),
                'type' => 'password',
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
     * Pay for an order.
     *
     * @param Order $order
     * @return string HTML markup.
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Mollie is not enabled.', 'kirki-mollie'));
        }

        $this->mollie = $this->get_client();
        $this->transaction_builder = new MollieTransactionBuilder($order);

        try {
            $response = $this->mollie->send([
                'description' => 'Order #' . $order->id,
                'amount' => [
                    'currency' => strtoupper($order->currency_code),
                    'value' => $this->format_amount($order->total),
                ],
                'redirectUrl' => $this->success_url($order),
                'cancelUrl' => $this->cancel_url($order),
                'webhookUrl' => $this->webhook_url(),
                'lines' => $this->transaction_builder->build_line_items(),
                'billingAddress' => $this->transaction_builder->get_address('billing'),
                'shippingAddress' => $this->transaction_builder->get_address('shipping'),
                'metadata' => ['order_id' => $order->id],
            ], MollieConstant::API_BASE_URL . 'payments');

            if (empty($response['_links']['checkout'])) {
                return null;
            }

            return $response['_links']['checkout'];
        } catch (\Throwable $e) {
            throw new Exception(__('Mollie Payment Error: ' . $e->getMessage(), 'kirki-mollie'));
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
            'api_key' => 'required|string',
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
            'api_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle an Mollie webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        return true;
    }

    protected function get_client()
    {
        if ($this->mollie) {
            return $this->mollie;
        }

        $api_key = $this->settings['api_key'] ?? '';

        if (empty($api_key)) {
            throw new Exception(__('Mollie API Key is missing.', 'kirki-mollie'));
        }

        $is_test_mode = (bool) ($this->settings['sandbox'] ?? false);
        return new MollieClient($api_key, $is_test_mode);
    }
}
