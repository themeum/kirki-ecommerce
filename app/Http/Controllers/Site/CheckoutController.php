<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCreateRequest;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class CheckoutController
{
    public function store(OrderCreateRequest $request, CreateOrderAction $action)
    {
        $currency_code = $request->string('currency_code') ?? $headers['kirki-ecommerce-currency-code'] ?? base_currency()->code; //todo: implement change the name later

        $dto = CreateOrderPayloadDTO::from_request($request);
        $dto->is_manual = user()->is_admin() && $request->bool('is_manual') ? true : false;
        $dto->created_by = user()->get_id() ?? null;
        $dto->currency_code = $currency_code;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order created successfully.', 'kirki-ecommerce'),
        ], 201);
    }
}
