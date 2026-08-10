<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCreateRequest;
use Kirki\Ecommerce\App\Resources\Order\OrderListResource;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderUpdateRequest;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Actions\Order\CreateRefundAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateRefundAction;
use Kirki\Ecommerce\App\Actions\Order\DeleteRefundAction;
use Kirki\Ecommerce\App\Actions\Order\PerformOrderAction;
use Kirki\Ecommerce\App\DTO\Order\PerformOrderActionDTO;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Order\RefundCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Order\RefundUpdateRequest;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class OrderController
{
    protected $service;
    public function __construct(OrderService $service)
    {
        $this->service = $service;
    }
    public function get(Request $request)
    {
        $params = OrderListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'uuid', 'order_number', 'customer_id', 'order_status', 'sub_total', 'invoiced_total', 'payment_provider', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all_orders($params);
            $data = new Paginator($data, $data->count(), $data->count(), 1);
        } else {
            $data = $this->service->paginated_orders($params);
        }

        return response()->json([
            'data' => OrderListResource::paginated($data),
            'message' => __('Orders retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
    public function store(OrderCreateRequest $request, CreateOrderAction $action)
    {
        // @todo: in future the header will come from a constant
        $currency_code = $request->string('currency_code') ?? $request->get_header('kirki-ecommerce-currency-code') ?? base_currency()->code; //todo: implement change the name later

        $dto = CreateOrderPayloadDTO::from_request($request);
        $dto->is_manual = user()->is_admin() && $request->bool('is_manual') ? true : false;
        $dto->created_by = user()->get_id() ?? null;
        $dto->currency_code = $currency_code;
        $dto->cart_token = $request->get_header('x-cart-token');

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order created successfully.', 'kirki-ecommerce'),
        ], 201);
    }

    public function show(Request $request)
    {
        $order = $this->service->find_order_or_fail($request->int('id'));

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(OrderUpdateRequest $request, UpdateOrderAction $action)
    {
        $headers = $request->get_headers();
        $currency_code = $request->string('currency_code') ?? $headers['kirki-currency-code'] ?? base_currency()->code; //todo: implement change the name later

        $dto = UpdateOrderPayloadDTO::from_request($request);
        $dto->currency_code = $currency_code;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete_order_or_fail($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Order deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $data = $request->all();

        $action = $data['action'];
        $ids = $data['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Orders deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = OrderListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All orders deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }

    public function action(OrderActionRequest $request, PerformOrderAction $action)
    {
        $dto = PerformOrderActionDTO::from_request($request);
        $dto->order_id = $request->int('id');
        $dto->updated_by = user()->get_id() ?? null;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Action performed successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create_refund(RefundCreateRequest $request, CreateRefundAction $action)
    {
        $dto = CreateRefundPayloadDTO::from_request($request);
        $dto->created_by = user()->get_id() ?? null;

        $updated_order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund processed successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update_refund(RefundUpdateRequest $request, UpdateRefundAction $action)
    {
        $dto = UpdateRefundPayloadDTO::from_request($request);
        $dto->updated_by = user()->get_id() ?? null;

        $updated_order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete_refund(Request $request, DeleteRefundAction $action)
    {
        $updated_order = $action->execute($request->int('order_id'), $request->int('id'));

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund deleted successfully.', 'kirki-ecommerce'),
        ]);
    }
}
