<?php

namespace Kirki\Ecommerce\App\Payment\Facades;

use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\App\Payment\PaymentManager;

/**
 * @method static void init_registry()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_all_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_online_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_offline_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_available_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_available_online_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider[] get_available_offline_providers()
 * @method static \Kirki\Ecommerce\App\Payment\PaymentProvider|null get_provider($id)
 *
 * @see \Kirki\Ecommerce\App\Payment\PaymentManager
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
