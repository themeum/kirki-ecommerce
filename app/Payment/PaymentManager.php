<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;

use function Kirki\Ecommerce\Framework\collection;

defined('ABSPATH') || exit;

class PaymentManager
{
    /**
     * @var array<string, PaymentProvider>
     */
    protected $providers_registry = [];

    /**
     * PaymentManager constructor.
     */
    public function __construct()
    {
        $this->init_registry();
    }

    /**
     * Initialize the registry.
     */
    public function init_registry()
    {
        $providers = apply_filters(
            HookNames::ECOMMERCE_PAYMENT_PROVIDERS,
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
     * Get all providers.
     *
     * @return PaymentProvider[]
     */
    public function get_all_providers()
    {
        return array_values($this->providers_registry);
    }

    /**
     * Get all online providers.
     *
     * @return Payme[]
     */
    public function get_online_providers()
    {
        return collection($this->providers_registry)->reject(fn($provider) => $provider->is_offline())->values()->all();
    }

    /**
     * Get all offline providers.
     *
     * @return PaymentProvider[]
     */
    public function get_offline_providers()
    {
        return collection($this->providers_registry)->filter(fn($provider) => $provider->is_offline())->values()->all();
    }

    /**
     * Get available providers.
     *
     * @return PaymentProvider[]
     */
    public function get_available_providers()
    {
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled())->values()->all();
    }

    /**
     * Get available online providers.
     *
     * @return PaymentProvider[]
     */
    public function get_available_online_providers()
    {
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled() && !$provider->is_offline())->values()->all();
    }

    /**
     * Get available offline providers.
     *
     * @return PaymentProvider[]
     */
    public function get_available_offline_providers()
    {
        return collection($this->providers_registry)->filter(fn($provider) => $provider->enabled() && $provider->is_offline())->values()->to_array();
    }

    /**
     * Get a specific provider.
     *
     * @param string $id Provider ID.
     * @return PaymentProvider|null
     */
    public function get_provider($id)
    {
        return $this->providers_registry[$id] ?? null;
    }

    /**
     * Get the next payment step for an order.
     *
     * @param Order $order Order.
     * @return PaymentActionDTO|null Null when the order's gateway is missing or manual.
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
