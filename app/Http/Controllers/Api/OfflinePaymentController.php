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

/**
 * REST controller for managing offline payment methods.
 *
 * @since 1.0.0
 */
class OfflinePaymentController
{
    /** @var OfflinePaymentService */
    protected $service;

    /**
     * Create the controller with the offline payment service.
     *
     * @since 1.0.0
     *
     * @param OfflinePaymentService $service
     */
    public function __construct(OfflinePaymentService $service)
    {
        $this->service = $service;
    }

    /**
     * List all offline payment methods.
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
            'data' => OfflinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create an offline payment method from the validated request.
     *
     * @since 1.0.0
     *
     * @param OfflinePaymentCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created payment method with a 201 status.
     */
    public function create(OfflinePaymentCreateRequest $request)
    {
        $payload = CreateOfflinePaymentDTO::from_request($request);

        $offline_payment = $this->service->create($payload);

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single offline payment method by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The payment method resource.
     */
    public function show(Request $request)
    {
        $offline_payment = $this->service->find_or_fail($request->string('id'));

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an offline payment method from the validated request.
     *
     * @since 1.0.0
     *
     * @param OfflinePaymentUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated payment method.
     */
    public function update(OfflinePaymentUpdateRequest $request)
    {
        $payload = UpdateOfflinePaymentDTO::from_request($request);

        $offline_payment = $this->service->update($payload);

        return response()->json([
            'data' => OfflinePaymentResource::make($offline_payment),
            'message' => __('Payment method updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single offline payment method by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the deletion result.
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete($request->string('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Payment method deleted', 'kirki-ecommerce'),
        ]);
    }
}
