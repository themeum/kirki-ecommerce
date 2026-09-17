<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Concerns\HasCartToken;
use Kirki\Ecommerce\App\Constants\CookieNames;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCreateRequest;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class CheckoutController
{
    use HasCartToken;
    public function store(OrderCreateRequest $request, CreateOrderAction $action)
    {
        $user_id = user()->get_id();

        $dto = CreateOrderPayloadDTO::from_request($request);
        $dto->is_manual = user()->is_admin() && $request->bool('is_manual') ? true : false;
        $dto->created_by = $user_id ?: null;
        $dto->customer_id = !empty($user_id) ? customer($user_id)->get_customer_id() : null;
        $dto->cart_token = $this->cart_token($request);
        $dto->user_id = !empty($user_id) ? (int) $user_id : null;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order created successfully.', 'kirki-ecommerce'),
        ], 201);
    }
}
