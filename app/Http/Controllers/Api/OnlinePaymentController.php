<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\OnlinePayment\InstallableOnlinePaymentListResource;
use Kirki\Ecommerce\App\Resources\OnlinePayment\OnlinePaymentListResource;
use Kirki\Ecommerce\App\Resources\OnlinePayment\OnlinePaymentResource;
use Kirki\Ecommerce\App\Services\OnlinePaymentService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

class OnlinePaymentController
{
    protected $service;

    public function __construct(OnlinePaymentService $service)
    {
        $this->service = $service;
    }

    public function all(Request $request)
    {
        $data = $this->service->all_installable_providers();

        return response()->json([
            'data' => InstallableOnlinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function install(Request $request)
    {
        $id = $request->string('id');
        $data = $this->service->install($request->string('id'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment gateway installed successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => OnlinePaymentListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function show(Request $request)
    {
        $data = $this->service->find_or_fail($request->string('id'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(Request $request)
    {
        $data = $this->service->update($request->string('id'), $request->array('data'));

        return response()->json([
            'data' => OnlinePaymentResource::make($data),
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function set_enabled(Request $request)
    {
        $is_updated = $this->service->set_enabled($request->string('id'), $request->bool('is_enabled', false));

        return response()->json([
            'data' => $is_updated,
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    //@todo remove this later as its just to mock the zip download
    public function download(Request $request)
    {
        $this->service->mock_download_provider_zip($request->string('id'));

        return response()->json([
            'message' => __('Payment gateway downloaded successfully.', 'kirki-ecommerce'),
        ]);
    }
}
