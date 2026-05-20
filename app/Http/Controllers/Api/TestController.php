<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Http\Request;

use Kirki\Ecommerce\Supports\AddonPlugin;
use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\response;

// This controller is used for testing purpose only.
// Hit {{base_url}}/test for accessing this.
class TestController
{

    public function test(Request $request)
    {
        // CurrencyExchange::sync();

        return response()->json([
            'message' => 'Hello World',
            'base_url' => app()->base_url('test'),
            'usage' => CurrencyExchange::get_active_provider()->get_usage()->all(),
            'is_installed' => AddonPlugin::install('https://kirki.com/addons/paypal-gateway')
            // 'refund' => Payment::get_gateway('paypal')->refund(Order::find(7), 1)
            // 'pay' => Payment::get_gateway('paypal')->pay(Order::find(8))
        ]);
    }
}
