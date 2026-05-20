<?php

namespace Kirki\Ecommerce\App\Payment\Facades;

use Kirki\Ecommerce\Facade;
use Kirki\Ecommerce\App\Payment\PaymentManager;

/**
 * @method static void init_registry()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_all_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_all_online_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_all_manual_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_available_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_available_online_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway[] get_available_manual_gateways()
 * @method static \Ecommerce\App\Payment\PaymentGateway|null get_gateway($id)
 *
 * @see \Ecommerce\App\Payment\PaymentManager
 */
class Payment extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    public static function get_accessor()
    {
        return PaymentManager::class;
    }
}
