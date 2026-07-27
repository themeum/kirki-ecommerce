<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Route;
use Kirki\Ecommerce\Exceptions\ValidationException;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Supports\Facades\Option;
use Exception;

use function Kirki\Ecommerce\app;

defined('ABSPATH') || exit;

class PaymentGateway
{
    /**
     * Order service.
     *
     * @var OrderService
     */
    protected $order_service;

    /**
     * Payment Gateway ID.
     *
     * @var string
     */
    protected $id;

    /**
     * Check if the payment method is enabled.
     *
     * @var bool
     */
    protected $is_enabled = false;
    /**
     * Check if the payment method is manual.
     *
     * @var bool
     */
    protected $is_manual = false;

    /**
     * Payment method title for the frontend.
     *
     * @var string
     */
    protected $title;

    /**
     * Payment method description for the frontend.
     *
     * @var string
     */
    protected $description;

    /**
     * True if the gateway shows fields on the checkout.
     *
     * @var bool
     */
    protected $has_fields;

    /**
     * Countries this gateway is allowed for.
     *
     * @var array
     */
    protected $countries;

    /**
     * Available for all counties or specific.
     *
     * @var string
     */
    protected $availability = 'all';

    /**
     * Icon for the gateway.
     *
     * @var string
     */
    protected $icon;

    /**
     * Maximum transaction amount, zero does not define a maximum.
     *
     * @var int
     */
    protected $max_amount = 0;

    /**
     * Admin fields.
     *
     * @var array
     */
    protected $admin_fields = [];

    /**
     * Settings key.
     *
     * @var string
     */
    protected $settings_key;

    /**
     * Payment gateway settings.
     *
     * @var array
     */
    protected $settings = [];

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->order_service = app()->make(OrderService::class);

        $this->init_settings();
        $this->init_admin_fields();
        $this->is_enabled = isset($this->settings['is_enabled']) ? (bool) $this->settings['is_enabled'] : false;
    }

    /**
     * Create a payment gateway from an array for manual payment.
     *
     * @param array $data
     * @return static
     */
    public static function from_manual(array $data)
    {
        $payment_gateway = new static();

        $payment_gateway->id = $data['id'] ?? '';
        $payment_gateway->title = $data['name'] ?? '';
        $payment_gateway->description = $data['instructions'] ?? '';
        $payment_gateway->icon = $data['icon'] ?? '';
        $payment_gateway->is_enabled = $data['is_enabled'] ?? false;
        $payment_gateway->is_manual = true;
        $payment_gateway->settings_key = $data['settings_key'] ?? $data['id'];

        return $payment_gateway;
    }

    /**
     * Get the payment gateway ID.
     *
     * @return string
     */
    public function id()
    {
        return $this->id;
    }

    /**
     * Check if the payment method is enabled.
     *
     * @return bool
     */
    public function enabled()
    {
        return $this->is_enabled;
    }

    /**
     * Set the payment method is enabled or not.
     *
     * @param bool $is_enabled
     * @return void
     */
    public function set_is_enabled(bool $is_enabled)
    {
        $this->is_enabled = $is_enabled;
        $this->save_settings($this->settings());
    }

    /**
     * Check if the payment method is manual.
     *
     * @return bool
     */
    public function is_manual()
    {
        return $this->is_manual;
    }

    /**
     * Check if the payment method has fields.
     *
     * @return bool
     */
    public function has_fields()
    {
        return $this->has_fields;
    }

    /**
     * Return the title.
     *
     * @return string
     */
    public function title()
    {
        return $this->title;
    }

    /**
     * Return the description.
     *
     * @return string
     */
    public function description()
    {
        return $this->description;
    }

    /**
     * Return the icon.
     *
     * @return string
     */
    public function icon()
    {
        return $this->icon;
    }

    /**
     * Return the maximum amount.
     *
     * @return int
     */
    public function max_amount()
    {
        return $this->max_amount;
    }

    /**
     * Return the admin fields.
     *
     * @return array
     */
    public function admin_fields()
    {
        return $this->admin_fields;
    }

    /**
     * Set the admin fields.
     *
     * @param array $admin_fields
     */
    public function set_admin_fields(array $admin_fields)
    {
        $this->admin_fields = $admin_fields;
    }

    /**
     * Return the settings.
     *
     * @return array
     */
    public function settings()
    {
        $settings = $this->settings;
        unset($settings['is_enabled']);

        return $settings;
    }

    /**
     * Save the settings.
     *
     * @param array $settings
     * @return bool
     *
     * @throws ValidationException
     */
    public function save_settings(array $settings)
    {
        $this->validate_settings($settings);

        $this->is_enabled = (bool) $this->is_enabled;
        $this->settings = array_merge($settings, ['is_enabled' => $this->is_enabled]);

        return Option::set($this->settings_key, $this->settings);
    }

    /**
     * Process Payment.
     *
     * Process the payment. Override this in your gateway.
     *
     * @param Order $order Order.
     * @return string Return/Redirect URL.
     *
     * @throws Exception
     */
    public function pay(Order $order)
    {
        return $this->return_url($order);
    }

    /**
     * Process refund.
     *
     * If the gateway declares 'refunds' support, this will allow it to refund.
     * a passed in amount.
     *
     * @param  Order        $order Order.
     * @param  Refund       $refund Refund.
     * @return bool|\WP_Error True or false based on success, or a WP_Error object.
     */
    public function refund(Order $order, Refund $refund)
    {
        return true;
    }

    /**
     * Validate frontend fields.
     *
     * Validate payment fields on the frontend.
     *
     * @return bool
     */
    public function validate_fields()
    {
        return true;
    }

    /**
     * Default payment fields display. Override this in your gateway to customize displayed fields.
     *
     * By default this renders the payment gateway description.
     *
     */
    public function payment_fields()
    {
        // Implement this in your gateway.
    }

    /**
     * Webhook handler.
     *
     * @return bool
     */
    public function webhook()
    {
        return true;
    }

    /**
     * Get the webhook URL.
     *
     * @return string
     */
    public function webhook_url()
    {
        return Route::url('payment/webhook/' . $this->id());
    }

    /**
     * Get the webhook events.
     *
     * @return array
     */
    public function webhook_events()
    {
        return [];
    }

    protected function init_admin_fields()
    {
        // Implement this in your gateway.
    }

    /**
     * Validate the settings for admin screens.
     *
     * @param array $settings
     * @return bool
     *
     * @throws ValidationException
     */
    protected function validate_settings(array $settings)
    {
        return true;
    }

    /**
     * Sanitize the settings for admin screens.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        return $settings;
    }

    /**
     * Initialize the settings for admin screens.
     *
     * @return void
     */
    protected function init_settings()
    {
        $this->settings = $this->settings_key ? Option::get($this->settings_key, []) : [];
    }

    /**
     * Get the return URL for the payment gateway.
     *
     * @param Order|null $order Order.
     * @return string
     */
    protected function return_url($order = null)
    {
        // @TODO: Implement return_url() method.
        if (!$order) {
            return site_url();
        }

        return home_url();
    }

    protected function get_item_description($order_item, $currency = null)
    {
        $parts = [];

        if ($order_item->quantity > 0) {
            $parts[] = sprintf(
                /* translators: %d: quantity */
                __('Quantity: %d', 'kirki-ecommerce'),
                $order_item->quantity
            );
        }

        if (($order_item->subtotal ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: subtotal amount */
                __('Subtotal: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->subtotal, $currency))
            );
        }

        if (($order_item->discount_amount ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: discount amount */
                __('Discount: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->discount_amount, $currency))
            );
        }

        if (($order_item->tax_total ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: tax amount */
                __('Tax: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->tax_total, $currency))
            );
        }

        return implode(' | ', $parts);
    }
}
