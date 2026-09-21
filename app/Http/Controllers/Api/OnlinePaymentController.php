<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\OnlinePayment\InstallableOnlinePaymentListResource;
use Kirki\Ecommerce\App\Resources\OnlinePayment\OnlinePaymentListResource;
use Kirki\Ecommerce\App\Resources\OnlinePayment\OnlinePaymentResource;
use Kirki\Ecommerce\App\Services\OnlinePaymentService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for installing and configuring online payment gateways.
 *
 * @since 1.0.0
 */
class OnlinePaymentController
{
    /** @var OnlinePaymentService */
    protected $service;

    /**
     * Create the controller with the online payment service.
     *
     * @since 1.0.0
     *
     * @param OnlinePaymentService $service
     */
    public function __construct(OnlinePaymentService $service)
    {
        $this->service = $service;
    }

    /**
     * List every online payment gateway that can be installed.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Installable gateway collection with a success message.
     */
    public function all(Request $request)
    {
        $data = $this->service->all_installable_providers();

        return response()->json([
            'data' => InstallableOnlinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Install the online payment gateway identified by the `id` parameter.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The installed gateway resource.
     */
    public function install(Request $request)
    {
        $id = $request->string('id');
        $data = $this->service->install($request->string('id'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment gateway installed', 'kirki-ecommerce'),
        ]);
    }

    /**
     * List the installed online payment gateways.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Gateway collection with a success message.
     */
    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => OnlinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single online payment gateway by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The gateway resource.
     */
    public function show(Request $request)
    {
        $data = $this->service->find_or_fail($request->string('id'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Save the settings in the `data` parameter to an online payment gateway.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated gateway resource.
     */
    public function update(Request $request)
    {
        $data = $this->service->update($request->string('id'), $request->array('data'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment method updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Enable or disable an online payment gateway per the `is_enabled` parameter.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The service result in `data`.
     */
    public function set_enabled(Request $request)
    {
        $is_updated = $this->service->set_enabled($request->string('id'), $request->bool('is_enabled', false));

        return response()->json([
            'data' => $is_updated,
            'message' => __('Payment method updated', 'kirki-ecommerce'),
        ]);
    }

    //@todo remove this later as its just to mock the zip download
    /**
     * Mock the download of a gateway's zip package.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success message.
     */
    public function download(Request $request)
    {
        $this->service->mock_download_provider_zip($request->string('id'));

        return response()->json([
            'message' => __('Payment gateway downloaded', 'kirki-ecommerce'),
        ]);
    }
}
