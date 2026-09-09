<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Request;

use Kirki\Ecommerce\Framework\Http\Response;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;

class WebhookController
{
    public function handle(Request $request, $provider_id)
    {
        $provider = Payment::get_provider($provider_id);

        throw_if(!$provider, __('Invalid payment gateway', 'kirki-ecommerce'), NotFoundException::class);

        $result = $provider->webhook();

        return response()->json([
            'success' => $result,
            'message' => $result ? __('Webhook handled successfully', 'kirki-ecommerce') : __('Webhook handling failed', 'kirki-ecommerce'),
        ], $result ? Response::OK : Response::BAD_REQUEST);
    }
}
