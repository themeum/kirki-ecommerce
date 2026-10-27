<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Http\Requests\PaymentMethod\PaymentMethodOrderRequest;
use Kirki\Ecommerce\App\Resources\PaymentMethod\PaymentMethodListResource;
use Kirki\Ecommerce\App\Services\PaymentMethodService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for listing payment methods.
 *
 * @since 1.0.0
 */
class PaymentMethodController
{
    /** @var PaymentMethodService */
    protected $service;

    /**
     * Create the controller with the payment method service.
     *
     * @since 1.0.0
     *
     * @param PaymentMethodService $service
     */
    public function __construct(PaymentMethodService $service)
    {
        $this->service = $service;
    }

    /**
     * List all payment methods, offline and online.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Payment method collection with a success message.
     */
    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => PaymentMethodListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Save the order of the payment methods.
     *
     * @since 1.0.0
     *
     * @param PaymentMethodOrderRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Payment method collection in the new order with a success message.
     */
    public function reorder(PaymentMethodOrderRequest $request)
    {
        $data = $this->service->reorder($request->array('ids'));

        return response()->json([
            'data' => PaymentMethodListResource::collection($data),
            'message' => __('Payment methods reordered.', 'kirki-ecommerce'),
        ]);
    }
}
