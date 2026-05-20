<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Constants\OptionKeys;

use function Kirki\Ecommerce\settings;

defined('ABSPATH') || exit;

class ManualPaymentFactory
{
    public static function make()
    {
        $settings = settings(OptionKeys::PAYMENT_SETTINGS);
        $manual_methods = $settings->get('payment_gateways') ?? [];
        $payment_gateways = [];

        foreach ($manual_methods as $method) {
            $payment_gateway = PaymentGateway::from_manual($method);
            $payment_gateways[] = $payment_gateway;
        }

        return $payment_gateways;
    }
}
