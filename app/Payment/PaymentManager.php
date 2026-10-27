<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;

use function Kirki\Ecommerce\App\settings;
use function Kirki\Ecommerce\Framework\collection;

defined('ABSPATH') || exit;

/**
 * Registry of the available payment providers.
 *
 * Holds the offline providers from settings, PayPal, and any providers
 * added through the payment providers filter, keyed by provider ID.
 *
 * @since 1.0.0
 */
class PaymentManager
{
    /** @var array<string, PaymentProvider> */
    protected $providers_registry = [];

    /**
     * Create the manager and populate the provider registry.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->init_registry();
    }

    /**
     * Populate the registry with the offline providers and PayPal.
     *
     * The list passes through the payment providers filter so extensions can
     * add or remove providers.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function init_registry()
    {
        $providers = apply_filters(
            DevHookNames::PAYMENT_PROVIDERS,
            array_merge(
                OfflinePaymentFactory::make(),
                [new PayPal()]
            ),
        );

        foreach ($providers as $provider) {
            $this->providers_registry[$provider->id()] = $provider;
        }
    }

    /**
     * Get every registered provider.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_all_providers()
    {
        return $this->ordered_providers()->all();
    }

    /**
     * Sort providers by the merchant-defined order.
     *
     * Providers listed in the stored `methods_order` come first, in that order.
     * The rest follow in their given order. Stored IDs that match no provider
     * are ignored.
     *
     * @since 1.0.0
     *
     * @param PaymentProvider[] $providers Providers to sort.
     * @return PaymentProvider[]
     */
    public function order_providers(array $providers)
    {
        $providers_by_id = [];

        foreach ($providers as $provider) {
            $providers_by_id[$provider->id()] = $provider;
        }

        $stored_order = settings(OptionKeys::PAYMENT_SETTINGS)->get('methods_order');
        $stored_order = is_array($stored_order) ? array_values($stored_order) : [];
        $ordered = [];

        foreach ($stored_order as $id) {
            if (is_string($id) && isset($providers_by_id[$id])) {
                $ordered[$id] = $providers_by_id[$id];
            }
        }

        return array_values($ordered + array_diff_key($providers_by_id, $ordered));
    }

    /**
     * Get the registry sorted by the merchant-defined order.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of PaymentProvider.
     */
    protected function ordered_providers()
    {
        return collection($this->order_providers($this->providers_registry));
    }

    /**
     * Get the registered providers that are processed online.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_online_providers()
    {
        return $this->ordered_providers()->reject(fn($provider) => $provider->is_offline())->values()->all();
    }

    /**
     * Get the registered providers that are offline (manual) payment methods.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_offline_providers()
    {
        return $this->ordered_providers()->filter(fn($provider) => $provider->is_offline())->values()->all();
    }

    /**
     * Get the enabled providers.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_available_providers()
    {
        return $this->ordered_providers()->filter(fn($provider) => $provider->enabled())->values()->all();
    }

    /**
     * Get the enabled online providers.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_available_online_providers()
    {
        return $this->ordered_providers()->filter(fn($provider) => $provider->enabled() && !$provider->is_offline())->values()->all();
    }

    /**
     * Get the enabled offline providers.
     *
     * @since 1.0.0
     *
     * @return PaymentProvider[]
     */
    public function get_available_offline_providers()
    {
        return $this->ordered_providers()->filter(fn($provider) => $provider->enabled() && $provider->is_offline())->values()->to_array();
    }

    /**
     * Get a provider by its ID.
     *
     * @since 1.0.0
     *
     * @param string $id Provider ID.
     * @return PaymentProvider|null Null when no provider is registered under the ID.
     */
    public function get_provider($id)
    {
        return $this->providers_registry[$id] ?? null;
    }

    /**
     * Build the provider snapshot stored in an order's payment metadata.
     *
     * @since 1.0.0
     *
     * @param string|null $id Provider ID.
     * @return array<string, mixed>|null Provider id, name, icon and offline flag; null when the provider is unknown.
     */
    public function build_snapshot($id)
    {
        $provider = empty($id) ? null : $this->get_provider($id);

        if (!$provider) {
            return null;
        }

        return [
            'payment_provider' => [
                'id' => $provider->id(),
                'name' => $provider->title(),
                'icon' => $provider->icon(),
                'is_offline' => $provider->is_offline(),
            ],
        ];
    }

    /**
     * Get the next payment step for an order from its payment provider.
     *
     * @since 1.0.0
     *
     * @param Order $order Order.
     * @return PaymentActionDTO|null Null when the order's provider is not registered.
     */
    public function pay(Order $order)
    {
        $gateway = $this->get_provider($order->payment_provider);

        if (!$gateway) {
            return null;
        }

        return $gateway->pay($order);
    }
}
