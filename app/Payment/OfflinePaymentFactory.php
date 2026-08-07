<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\OptionKeys;

use function Kirki\Ecommerce\App\settings;

defined('ABSPATH') || exit;

class OfflinePaymentFactory
{
    public static function make()
    {
        $settings = settings(OptionKeys::PAYMENT_SETTINGS);
        $offline_payments = $settings->get('offline_payments') ?? [];
        $providers = [];

        foreach ($offline_payments as $offline_payment) {
            $providers[] = PaymentProvider::from_offline($offline_payment);
        }

        return $providers;
    }
}
