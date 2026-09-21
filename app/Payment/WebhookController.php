<?php

namespace Kirki\Ecommerce\App\Payment;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\RedirectResponse;
use Kirki\Ecommerce\Framework\Http\Request;

use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Sanitizer;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Handles webhook and return requests coming from payment providers.
 *
 * @since 1.0.0
 */
class WebhookController
{
    /**
     * Handle a webhook request sent by a payment provider.
     *
     * Delegates to the provider's webhook(). A WebhookResult is emitted as the
     * raw response body; otherwise a JSON success or failure envelope is
     * returned.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @param string  $provider_id Payment provider ID from the route.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     * @throws NotFoundException When no provider matches the ID.
     */
    public function handle(Request $request, $provider_id)
    {
        $provider = Payment::get_provider($provider_id);

        throw_if(!$provider, __('Invalid payment gateway', 'kirki-ecommerce'), NotFoundException::class);

        $result = $provider->webhook();

        if ($result instanceof WebhookResult) {
            add_filter('rest_pre_serve_request', function () use ($result) {
                $content_type = Sanitizer::apply_rule($result->content_type(), Sanitizer::MIME_TYPE) ?: 'text/plain'; 
 
                header('Content-Type: ' . $content_type . '; charset=UTF-8');
                echo $result->raw_body(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

                return true;
            });

            $result = $result->success();
        }

        return response()->json([
            'success' => $result,
            'message' => $result ? __('Webhook handled successfully', 'kirki-ecommerce') : __('Webhook handling failed', 'kirki-ecommerce'),
        ], $result ? Response::OK : Response::BAD_REQUEST);
    }

    /**
     * Handle a customer returning from a hosted payment page.
     *
     * Sends the redirect the provider asks for, if any.
     *
     * @since 1.0.0
     *
     * @param Request $request     The return request, carrying whatever the gateway appended.
     * @param string  $provider_id Payment provider ID from the route.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     * @throws NotFoundException When no provider matches the ID.
     */
    public function handle_return(Request $request, $provider_id)
    {
        $provider = Payment::get_provider($provider_id);

        throw_if(!$provider, __('Invalid payment gateway', 'kirki-ecommerce'), NotFoundException::class);

        $result = $provider->handle_return($request);
        if ($result instanceof RedirectResponse) {
            $result->send();
        }

        return response()->json(['success' => true], Response::OK);
    }
}
