<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\Hooks\CustomHookNames;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;

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
            CustomHookNames::ECOMMERCE_PAYMENT_PROVIDERS,
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
        return array_values($this->providers_registry);
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
        return collection($this->providers_registry)->reject(fn($provider) => $provider->is_offline())->values()->all();
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
        return collection($this->providers_registry)->filter(fn($provider) => $provider->is_offline())->values()->all();
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
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled())->values()->all();
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
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled() && !$provider->is_offline())->values()->all();
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
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled() && $provider->is_offline())->values()->to_array();
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
