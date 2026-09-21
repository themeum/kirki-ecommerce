<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller exposing the available shipping methods.
 *
 * @since 1.0.0
 */
class ShippingMethodController
{
    /**
     * List all shipping methods.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Shipping methods with a success message.
     */
    public function get(Request $request)
    {
        $service = app()->make(ShippingService::class);

        return response()->json([
            'data' => $service->get_all_shipping_methods(),
            'message' => __('Shipping methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
