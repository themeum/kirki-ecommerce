<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Request;

use Kirki\Ecommerce\Http\Response;
use function Kirki\Ecommerce\response;

class WebhookController
{
    public function handle(Request $request, $gateway_id)
    {
        $gateway = Payment::get_gateway($gateway_id);

        if (!$gateway) {
            throw new NotFoundException(__('Invalid payment gateway', 'kirki-ecommerce'));
        }

        $result = $gateway->webhook();

        return response()->json([
            'success' => $result,
            'message' => $result ? __('Webhook handled successfully', 'kirki-ecommerce') : __('Webhook handling failed', 'kirki-ecommerce'),
        ], $result ? Response::OK : Response::BAD_REQUEST);
    }
}
