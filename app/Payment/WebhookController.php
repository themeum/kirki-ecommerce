<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Request;

use Kirki\Ecommerce\Framework\Http\Response;
use function Kirki\Ecommerce\Framework\response;

class WebhookController
{
    public function handle(Request $request, $provider_id)
    {
        $provider = Payment::get_provider($provider_id);

        if (!$provider) {
            throw new NotFoundException(__('Invalid payment gateway', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $result = $provider->webhook();

        return response()->json([
            'success' => $result,
            'message' => $result ? __('Webhook handled successfully', 'kirki-ecommerce') : __('Webhook handling failed', 'kirki-ecommerce'),
        ], $result ? Response::OK : Response::BAD_REQUEST);
    }
}
