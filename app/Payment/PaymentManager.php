<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\App\Payment\Gateways\PayPal;

use function Kirki\Ecommerce\Framework\collection;

defined('ABSPATH') || exit;

class PaymentManager
{
    /**
     * @var array<string, PaymentGateway>
     */
    protected $gateways_registry = [];

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
        $gateways = apply_filters(HookNames::ECOMMERCE_ALL_PAYMENT_GATEWAYS, array_merge(ManualPaymentFactory::make(), [
            new PayPal(),
        ]));

        foreach ($gateways as $gateway) {
            $this->gateways_registry[$gateway->id()] = $gateway;
        }
    }

    /**
     * Get all gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_all_gateways()
    {
        return array_values($this->gateways_registry);
    }

    /**
     * Get all online gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_all_online_gateways()
    {
        return array_values(collection($this->gateways_registry)->reject(fn($gateway) => $gateway->is_manual())->all());
    }

    /**
     * Get all manual gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_all_manual_gateways()
    {
        return collection($this->gateways_registry)->filter(fn($gateway) => $gateway->is_manual())->all();
    }

    /**
     * Get available gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_available_gateways()
    {
        return collection($this->gateways_registry)->filter(fn($gateway) => $gateway->enabled())->all();
    }

    /**
     * Get available online gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_available_online_gateways()
    {
        return collection($this->gateways_registry)->filter(fn($gateway) => $gateway->enabled() && !$gateway->is_manual())->all();
    }

    /**
     * Get available manual gateways.
     *
     * @return PaymentGateway[]
     */
    public function get_available_manual_gateways()
    {
        return collection($this->gateways_registry)->filter(fn($gateway) => $gateway->enabled() && $gateway->is_manual())->to_array();
    }

    /**
     * Get a specific gateway.
     *
     * @param string $id Gateway ID.
     * @return PaymentGateway|null
     */
    public function get_gateway($id)
    {
        return $this->gateways_registry[$id] ?? null;
    }
}
