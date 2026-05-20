<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\PaymentGateway\InstallablePaymentGatewayListResource;
use Kirki\Ecommerce\App\Resources\PaymentGateway\PaymentGatewayListResource;
use Kirki\Ecommerce\App\Resources\PaymentGateway\PaymentGatewayResource;
use Kirki\Ecommerce\App\Services\PaymentGatewayService;
use Kirki\Ecommerce\Contracts\Request;

use function Kirki\Ecommerce\response;

class PaymentGatewayController
{
    protected $service;

    public function __construct(PaymentGatewayService $service)
    {
        $this->service = $service;
    }

    public function all(Request $request)
    {
        $data = $this->service->all_installable_gateways();

        return response()->json([
            'data' => InstallablePaymentGatewayListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function install(Request $request)
    {
        $data = $this->service->install($request->get_string('id'));

        return response()->json([
            'data' => PaymentGatewayResource::make($data),
            'message' => __('Payment gateway installed successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function get(Request $request)
    {
        $data = $this->service->get();

        return response()->json([
            'data' => PaymentGatewayListResource::collection($data),
            'message' => __('Payment methods retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function show(Request $request)
    {
        $data = $this->service->find_or_fail($request->get_string('id'));

        return response()->json([
            'data' => PaymentGatewayResource::make($data),
            'message' => __('Payment method retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(Request $request)
    {
        $data = $this->service->update($request->get_string('id'), $request->get_array('data'));

        return response()->json([
            'data' => PaymentGatewayResource::make($data),
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function set_enabled(Request $request)
    {
        $is_updated = $this->service->set_enabled($request->get_string('id'), $request->get_bool('is_enabled', false));

        return response()->json([
            'data' => $is_updated,
            'message' => __('Payment method updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    //@todo remove this later as its just to mock the zip download
    public function download(Request $request)
    {
        $this->service->mock_download_gateway_zip($request->get_string('id'));

        return response()->json([
            'message' => __('Payment gateway downloaded successfully.', 'kirki-ecommerce'),
        ]);
    }
}
