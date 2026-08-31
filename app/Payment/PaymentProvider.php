<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Exception;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

class PaymentProvider
{
    /**
     * Order service.
     *
     * @var OrderService
     */
    protected $order_service;

    /**
     * Payment provider ID.
     *
     * @var string
     */
    protected $id;

    /**
     * Check if the payment provider is enabled.
     *
     * @var bool
     */
    protected $is_enabled = false;
    /**
     * Check if the payment provider is offline.
     *
     * @var bool
     */
    protected $is_offline = false;

    /**
     * Check if the payment provider is available.
     *
     * @var bool
     */
    protected $is_available = true;

    /**
     * Payment provider title for the frontend.
     *
     * @var string
     */
    protected $title;

    /**
     * Payment provider description for the frontend.
     *
     * @var string
     */
    protected $description;

    /**
     * True if the provider shows fields on the checkout.
     *
     * @var bool
     */
    protected $has_fields;

    /**
     * Countries this provider is allowed for.
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
     * Icon for the provider.
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
     * Payment provider settings.
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
     * Get the icon URL.
     *
     * @return string
     */
    public function icon_url(string $name)
    {
        return app()->base_url(sprintf('/payments/kirki-%s/assets/logo.svg', $name));
    }

    /**
     * Set the icon.
     *
     * @param string $icon
     * @return void
     */
    public function set_icon(string $icon)
    {
        $this->icon = $icon;
    }

    /**
     * Create an offline payment provider from an array.
     *
     * @param array $data
     * @return static
     */
    public static function from_offline(array $data)
    {
        $provider = new static();

        $icon = !empty($data['icon']) && is_int($data['icon']) ? $data['icon'] : null;
        $attachment = MediaAttachment::make($icon);
        $icon_url = $attachment['url'] ?? null;

        $provider->id = $data['id'] ?? '';
        $provider->title = $data['name'] ?? '';
        $provider->description = $data['instructions'] ?? '';
        $provider->icon = $icon_url;
        $provider->is_enabled = $data['is_enabled'] ?? false;
        $provider->is_offline = true;
        $provider->settings_key = $data['settings_key'] ?? $data['id'];

        return $provider;
    }

    /**
     * Create a payment provider from an array.
     *
     * @param array $data
     *
     * @return static
     */
    public static function make(array $data)
    {
        $provider = new static();

        $provider->id = $data['id'] ?? '';
        $provider->title = $data['name'] ?? '';
        $provider->description = $data['instructions'] ?? '';
        $provider->icon = $provider->icon_url($data['id']) ?? '';
        $provider->is_enabled = $data['is_enabled'] ?? false;
        $provider->is_offline = false;
        $provider->settings_key = $data['settings_key'] ?? $data['id'];
        $provider->is_available = $data['is_available'] ?? true;

        return $provider;
    }

    /**
     * Get the payment provider ID.
     *
     * @return string
     */
    public function id()
    {
        return $this->id;
    }

    /**
     * Check if the payment provider is enabled.
     *
     * @return bool
     */
    public function enabled()
    {
        return $this->is_enabled;
    }

    /**
     * Check if the payment provider is available.
     *
     * @return bool
     */
    public function available()
    {
        return $this->is_available;
    }

    /**
     * Set whether the payment provider is enabled.
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
     * Check if the payment provider is offline.
     *
     * @return bool
     */
    public function is_offline()
    {
        return $this->is_offline;
    }

    /**
     * Check if the payment provider has fields.
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
     * Process the payment. Override this in your provider.
     *
     * The returned "type" tells the frontend how to consume "value":
     * - PaymentActionType::REDIRECT: "value" is a URL to redirect the customer to.
     * - PaymentActionType::HTML: "value" is markup to render inline (e.g. an auto-submitting form).
     *
     * @param Order $order Order.
     * @return PaymentActionDTO
     *
     * @throws Exception
     */
    public function pay(Order $order)
    {
        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => $this->return_url($order),
        ]);
    }

    /**
     * Process refund.
     *
     * If the provider declares 'refunds' support, this will allow it to refund.
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
     * Default payment fields display. Override this in your provider to customize displayed fields.
     *
     * By default this renders the payment provider description.
     *
     */
    public function payment_fields()
    {
        // Implement this in your provider.
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
        if (!defined('KECOM_WEBHOOK_BASE_URL') || home_url() === KECOM_WEBHOOK_BASE_URL) {
            return Route::url('payment/webhook/' . $this->id());
        }

        $override_home = fn() => rtrim(KECOM_WEBHOOK_BASE_URL, '/');

        add_filter('pre_option_home', $override_home);
        $url = Route::url('payment/webhook/' . $this->id());
        remove_filter('pre_option_home', $override_home);

        return $url;
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
        // Implement this in your provider.
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
     * Get the return URL for the payment provider.
     *
     * @param Order $order Order.
     * @return string
     */
    protected function return_url($order)
    {
        if ($order) {
            return Url::get_checkout_success_url($order->uuid);
        }

        return home_url();
    }

    protected function get_item_description($order_item, $currency = null)
    {
        $parts = [];

        if ($order_item->invoiced_price > 0) {
            $parts[] = sprintf(
                /* translators: %s: price */
                __('Price: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->invoiced_price, $currency))
            );
        }

        if ($order_item->quantity > 0) {
            $parts[] = sprintf(
                /* translators: %d: quantity */
                __('Quantity: %d', 'kirki-ecommerce'),
                $order_item->quantity
            );
        }

        if (($order_item->invoiced_subtotal ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: subtotal amount */
                __('Subtotal: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->invoiced_subtotal, $currency))
            );
        }

        if (($order_item->invoiced_discount_amount ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: discount amount */
                __('Discount: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->invoiced_discount_amount, $currency))
            );
        }

        if (($order_item->invoiced_tax_total ?? 0) > 0) {
            $parts[] = sprintf(
                /* translators: %s: tax amount */
                __('Tax: %s', 'kirki-ecommerce'),
                Money::format(Money::from_minor($order_item->invoiced_tax_total, $currency))
            );
        }
        return implode(' | ', $parts);
    }

    /**
     * Format amount.
     *
     * @param int $amount
     * @param string $currency The order's currency code.
     * @return string
     */
    public static function format_amount($amount, $currency)
    {
        return number_format(Money::from_minor($amount, $currency)->getAmount()->toFloat(), 2, '.', '');
    }
}
