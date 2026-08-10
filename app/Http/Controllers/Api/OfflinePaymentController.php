<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\OfflinePayment\OfflinePaymentCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\OfflinePayment\OfflinePaymentUpdateRequest;
use Kirki\Ecommerce\App\Resources\OfflinePayment\OfflinePaymentListResource;
use Kirki\Ecommerce\App\Resources\OfflinePayment\OfflinePaymentResource;
use Kirki\Ecommerce\App\Services\OfflinePaymentService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\DTO\OfflinePayment\CreateOfflinePaymentDTO;
use Kirki\Ecommerce\App\DTO\OfflinePayment\UpdateOfflinePaymentDTO;

use function Kirki\Ecommerce\Framework\response;

class OfflinePaymentController
{
    protected $service;

    public function __construct(OfflinePaymentService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => OfflinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(OfflinePaymentCreateRequest $request)
    {
        $payload = CreateOfflinePaymentDTO::from_request($request);

        $offline_payment = $this->service->create($payload);

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $offline_payment = $this->service->find_or_fail($request->string('id'));

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(OfflinePaymentUpdateRequest $request)
    {
        $payload = UpdateOfflinePaymentDTO::from_request($request);

        $offline_payment = $this->service->update($payload);

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->string('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Payment method deleted successfully.', 'kirki-ecommerce'),
        ]);
    }
}
