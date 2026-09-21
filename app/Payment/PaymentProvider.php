<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\RedirectResponse;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Exception;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Base class for payment providers.
 *
 * Holds the shared settings and state, and defaults for the pay, refund and
 * webhook steps that concrete providers override.
 *
 * @since 1.0.0
 */
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
     * Available for all countries or specific ones.
     *
     * @var string
     */
    protected $availability = 'all';

    /**
     * Icon for the provider.
     *
     * @var string|null
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
     * Create the provider, loading its saved settings and admin fields.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->order_service = app()->make(OrderService::class);

        $this->init_settings();
        $this->init_admin_fields();
        $this->is_enabled = isset($this->settings['is_enabled']) ? (bool) $this->settings['is_enabled'] : false;
    }

    /**
     * Get the URL of a provider's bundled logo.
     *
     * @since 1.0.0
     *
     * @param string $name Provider slug used in the payments/kirki-{name} folder.
     * @return string
     */
    public function icon_url(string $name)
    {
        return app()->base_url(sprintf('/payments/kirki-%s/assets/logo.svg', $name));
    }

    /**
     * Set the provider's icon.
     *
     * @since 1.0.0
     *
     * @param string $icon
     * @return void
     */
    public function set_icon(string $icon)
    {
        $this->icon = $icon;
    }

    /**
     * Create an offline payment provider from a stored offline method.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Offline method data: id, name, instructions, icon (attachment ID), is_enabled and settings_key.
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
     * Create an online payment provider from an array of its attributes.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Provider data: id, name, instructions, is_enabled, is_available and settings_key.
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
     * @since 1.0.0
     *
     * @return string
     */
    public function id()
    {
        return $this->id;
    }

    /**
     * Check whether the payment provider is enabled.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function enabled()
    {
        return $this->is_enabled;
    }

    /**
     * Check whether the payment provider is available.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function available()
    {
        return $this->is_available;
    }

    /**
     * Set whether the payment provider is enabled and persist its settings.
     *
     * @since 1.0.0
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
     * Check whether the payment provider is an offline method.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_offline()
    {
        return $this->is_offline;
    }

    /**
     * Check whether the provider shows fields on the checkout.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function has_fields()
    {
        return $this->has_fields;
    }

    /**
     * Get the provider title shown on the frontend.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function title()
    {
        return $this->title;
    }

    /**
     * Get the provider description shown on the frontend.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function description()
    {
        return $this->description;
    }

    /**
     * Get the provider icon.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public function icon()
    {
        return $this->icon;
    }

    /**
     * Get the maximum transaction amount; zero means no maximum.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function max_amount()
    {
        return $this->max_amount;
    }

    /**
     * Get the fields shown on the provider's admin settings screen.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function admin_fields()
    {
        return $this->admin_fields;
    }

    /**
     * Set the fields shown on the provider's admin settings screen.
     *
     * @since 1.0.0
     *
     * @param array $admin_fields
     * @return void
     */
    public function set_admin_fields(array $admin_fields)
    {
        $this->admin_fields = $admin_fields;
    }

    /**
     * Get the provider's saved settings, without the is_enabled flag.
     *
     * @since 1.0.0
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
     * Validate and persist the provider settings.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $settings
     * @return bool
     * @throws ValidationException When the settings are invalid.
     */
    public function save_settings(array $settings)
    {
        $this->validate_settings($settings);

        $this->is_enabled = (bool) $this->is_enabled;
        $this->settings = array_merge($settings, ['is_enabled' => $this->is_enabled]);

        return Option::set($this->settings_key, $this->settings);
    }

    /**
     * Process the payment for an order and return the next step for the customer.
     *
     * Override this in your provider. The returned "type" tells the frontend
     * how to consume "value":
     * - PaymentActionType::REDIRECT: "value" is a URL to redirect the customer to.
     * - PaymentActionType::HTML: "value" is markup to render inline (e.g. an auto-submitting form).
     *
     * @since 1.0.0
     *
     * @param Order $order Order.
     * @return PaymentActionDTO
     * @throws Exception When the provider cannot start the payment.
     */
    public function pay(Order $order)
    {
        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => $this->return_url($order),
        ]);
    }

    /**
     * Refund a payment through the provider.
     *
     * Providers that support refunds override this to refund the amount of the
     * given refund. The base implementation reports success without doing anything.
     *
     * @since 1.0.0
     *
     * @param Order  $order  Order.
     * @param Refund $refund Refund.
     * @return bool|\WP_Error True or false based on success, or a WP_Error object.
     */
    public function refund(Order $order, Refund $refund)
    {
        return true;
    }

    /**
     * Validate the payment fields shown on the checkout.
     *
     * The base implementation accepts everything.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function validate_fields()
    {
        return true;
    }

    /**
     * Render the payment fields shown on the checkout.
     *
     * Does nothing by default; override in your provider.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function payment_fields()
    {
        // Implement this in your provider.
    }

    /**
     * Handle a webhook request sent by the payment gateway.
     *
     * The base implementation reports success. Return a WebhookResult to control
     * the raw response body.
     *
     * @since 1.0.0
     *
     * @return bool|WebhookResult
     */
    public function webhook()
    {
        return true;
    }

    /**
     * Get the URL the gateway should send webhooks to.
     *
     * In dev mode, a valid KECOM_WEBHOOK_BASE_URL constant replaces the site's
     * origin, so a tunnel can reach a local site.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function webhook_url()
    {
        $webhook_url = Route::url('payment/webhook/' . $this->id());

        if (!defined('KECOM_WEBHOOK_BASE_URL') || !app()->is_dev_mode()) {
            return $webhook_url;
        }

        $base     = untrailingslashit(home_url());
        $override = untrailingslashit(KECOM_WEBHOOK_BASE_URL);

        if (!wp_http_validate_url($override) || $base === $override) {
            return $webhook_url;
        }

        $parts = wp_parse_url($webhook_url);
        $path  = $parts['path'] ?? '/';

        return $override . '/' . ltrim($path, '/');
    }

    /**
     * Get the names of the webhook events the provider listens for.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function webhook_events()
    {
        return [];
    }

    /**
     * Define the provider's admin fields.
     *
     * Does nothing by default; override in your provider.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function init_admin_fields()
    {
        // Implement this in your provider.
    }

    /**
     * Validate the settings for admin screens.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $settings
     * @return bool
     * @throws ValidationException When the settings are invalid.
     */
    protected function validate_settings(array $settings)
    {
        return true;
    }

    /**
     * Sanitize the settings for admin screens.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    protected function sanitize_settings(array $settings)
    {
        return $settings;
    }

    /**
     * Load the saved settings from the options table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function init_settings()
    {
        $this->settings = $this->settings_key ? Option::get($this->settings_key, []) : [];
    }

    /**
     * Get the URL to send the customer to after the payment step.
     *
     * Uses the order's checkout success URL, or the home URL without an order.
     *
     * @since 1.0.0
     *
     * @param Order|null $order Order.
     * @return string
     */
    protected function return_url($order)
    {
        if ($order) {
            return Url::get_checkout_success_url($order->uuid);
        }

        return home_url();
    }

    /**
     * Build a pipe-separated summary of an order item's price, quantity, subtotal, discount and tax.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem $order_item
     * @param string|null                           $currency   Currency code used to format the amounts.
     * @return string
     */
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
     * Format a minor amount as a two-decimal string for gateway APIs.
     *
     * @since 1.0.0
     *
     * @param int    $amount   Amount in minor units.
     * @param string $currency The order's currency code.
     * @return string
     */
    public static function format_amount($amount, $currency)
    {
        return number_format(Money::from_minor($amount, $currency)->getAmount()->toFloat(), 2, '.', '');
    }

    /**
     * Handle a GET request to the webhook URL.
     *
     * Gateways that return the customer to this URL after payment override this
     * to confirm the result and return where to send them next. Returning null
     * gives a plain 200, which is enough for gateways that only check the URL is reachable.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return RedirectResponse|null
     */
    public function handle_return(Request $request)
    {
        return null;
    }
}
