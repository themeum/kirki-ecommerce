<?php
namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;

/**
 * Razorpay payment gateway.
 */
class Razorpay extends PaymentProvider
{
    protected $client;

    public function __construct()
    {
        $this->id = 'razorpay';
        $this->title = __('Razorpay', 'kirki-ecommerce');
        $this->description = __('Razorpay payment gateway', 'kirki-ecommerce');
        $this->icon = 'razorpay';
        $this->settings_key = 'razorpay';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'key_id',
                'label' => __('Key ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'key_secret',
                'label' => __('Key Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret',
                'label' => __('Webhook Secret', 'kirki-ecommerce'),
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
            throw new Exception(__('Razorpay is not enabled.', 'kirki-ecommerce'));
        }

        try {
            $this->client = new RazorpayClient();
            $razorpay_order = $this->client->post([
                'amount' => $order->invoiced_total,
                'currency' => strtoupper($order->currency_code)
            ], RazorpayConstant::API_URL . '/orders');


        } catch (Exception $e) {
            throw new Exception(sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-ecommerce'), $e->getMessage()));
        }
    }

    /**
     * Build an auto-submitting form that POSTs the payment token to
     * AuthorizeNet's hosted payment page.
     */
    protected function render_redirect_form(string $form_url, string $token): string
    {
        ob_start();
        return ob_get_clean();
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
            'key_id' => 'sometimes|string',
            'key_secret' => 'sometimes|string',
            'webhook_secret' => 'sometimes|string',
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
            'key_id' => Sanitizer::TEXT,
            'key_secret' => Sanitizer::TEXT,
            'webhook_secret' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle an Authorize.Net webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        return true;
    }

    protected function get_client(): RazorpayClient
    {
        if ($this->client) {
            return $this->client;
        }

        $key_id = $this->settings['key_id'] ?? '';
        $key_secret = $this->settings['key_secret'] ?? '';

        if (empty($key_id) || empty($key_secret)) {
            throw new Exception(__('Razorpay credentials are missing.', 'kirki-razorpay'));
        }

        $is_sandbox = (bool) ($this->settings['sandbox'] ?? false);
        return new RazorpayClient($key_id, $key_secret, $is_sandbox);
    }
}
