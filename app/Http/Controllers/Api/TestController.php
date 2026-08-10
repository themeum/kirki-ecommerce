<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\App\Supports\AddonPlugin;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Payments\Stripe;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\response;

// This controller is used for testing purpose only.
// Hit {{base_url}}/test for accessing this.
class TestController
{
    public function test(Request $request)
    {
        // CurrencyExchange::sync();

        // For Authorizenet testing.
        // header('Content-Type: text/html');
        // echo Payment::get_gateway('authorizenet')->pay(Order::find(2));
        // exit;

        $today = Date::today();

        return response()->json([
            'message' => 'Hello World',
            'money' => Money::from_minor(100, 'INR')->getAmounts(),
            'base_url' => app()->base_url('test'),
            'somoy' => $today->copy()->add_day(),
            'somoy2' => $today,
            'settings' => Settings::update('general.industry', 'tech'),
            // 'usage' => CurrencyExchange::get_active_provider()->get_usage()->all(),
            // 'is_installed' => AddonPlugin::install('https://kirki.com/addons/paypal-gateway')
            // 'refund' => Payment::get_provider('paypal')->refund(Order::find(7), 1)
            // 'pay' => Payment::get_provider('paypal')->pay(Order::find(8))
        ]);
    }
}
