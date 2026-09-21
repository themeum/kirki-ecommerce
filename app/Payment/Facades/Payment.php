<?php

namespace Kirki\Ecommerce\App\Payment\Facades;

use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\App\Payment\PaymentManager;

/**
 * Facade for the payment manager.
 *
 * @since 1.0.0
 *
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
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public static function get_accessor()
    {
        return PaymentManager::class;
    }
}
