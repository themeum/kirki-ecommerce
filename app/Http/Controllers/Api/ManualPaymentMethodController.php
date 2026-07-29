<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\PaymentMethod\PaymentMethodCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\PaymentMethod\PaymentMethodUpdateRequest;
use Kirki\Ecommerce\App\Resources\PaymentMethod\PaymentMethodListResource;
use Kirki\Ecommerce\App\Resources\PaymentMethod\PaymentMethodResource;
use Kirki\Ecommerce\App\Services\ManualPaymentMethodService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\DTO\PaymentMethod\CreatePaymentMethodDTO;
use Kirki\Ecommerce\App\DTO\PaymentMethod\UpdatePaymentMethodDTO;

use function Kirki\Ecommerce\Framework\response;

class ManualPaymentMethodController
{
    protected $service;

    public function __construct(ManualPaymentMethodService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => PaymentMethodListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(PaymentMethodCreateRequest $request)
    {
        $payload = CreatePaymentMethodDTO::from_request($request);

        $payment_method = $this->service->create($payload);

        return response()->json([
            'data' => PaymentMethodResource::make($payment_method),
            'message' => __('Payment method created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $payment_method = $this->service->find_or_fail($request->get_string('id'));

        return response()->json([
            'data' => PaymentMethodResource::make($payment_method),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(PaymentMethodUpdateRequest $request)
    {
        $payload = UpdatePaymentMethodDTO::from_request($request);

        $payment_method = $this->service->update($payload);

        return response()->json([
            'data' => PaymentMethodResource::make($payment_method),
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_string('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Payment method deleted successfully.', 'kirki-ecommerce'),
        ]);
    }
}
