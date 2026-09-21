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
use Kirki\Ecommerce\App\Http\Requests\Order\OrderListRequest;
use Kirki\Ecommerce\App\Http\Requests\Order\RefundCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Order\RefundUpdateRequest;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for managing orders and their refunds.
 *
 * @since 1.0.0
 */
class OrderController
{
    /** @var OrderService */
    protected $service;
    /**
     * Create the controller with the order service.
     *
     * @since 1.0.0
     *
     * @param OrderService $service
     */
    public function __construct(OrderService $service)
    {
        $this->service = $service;
    }
    /**
     * List orders, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param OrderListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated orders with a success message.
     */
    public function get(OrderListRequest $request)
    {
        $params = OrderListFilterDTO::from_array($request->all());

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
    /**
     * Create an order from the validated request.
     *
     * Only administrators can flag the order as manual.
     *
     * @since 1.0.0
     *
     * @param OrderCreateRequest $request
     * @param CreateOrderAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created order with a 201 status.
     */
    public function store(OrderCreateRequest $request, CreateOrderAction $action)
    {
        $user_id = user()->get_id();

        $dto = CreateOrderPayloadDTO::from_request($request);
        $dto->is_manual = user()->is_admin() && $request->bool('is_manual') ? true : false;
        $dto->created_by = !empty($user_id) ? $user_id : null;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order created', 'kirki-ecommerce'),
        ], 201);
    }

    /**
     * Return a single order by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The order resource.
     */
    public function show(Request $request)
    {
        $order = $this->service->find_order_or_fail($request->int('id'));

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an order from the validated request.
     *
     * @since 1.0.0
     *
     * @param OrderUpdateRequest $request
     * @param UpdateOrderAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated order.
     */
    public function update(OrderUpdateRequest $request, UpdateOrderAction $action)
    {
        $dto = UpdateOrderPayloadDTO::from_request($request);

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single order by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the deletion result.
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete_order_or_fail($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Order deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on orders.
     *
     * Supports deleting the given IDs or deleting every order matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
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
                    'message' => __('Orders deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = OrderListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All orders deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }

    /**
     * Perform a lifecycle action on an order on behalf of the current user.
     *
     * @since 1.0.0
     *
     * @param OrderActionRequest $request
     * @param PerformOrderAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated order.
     */
    public function action(OrderActionRequest $request, PerformOrderAction $action)
    {
        $dto = PerformOrderActionDTO::from_request($request);
        $dto->order_id = $request->int('id');
        $dto->updated_by = user()->get_id() ?? null;

        $order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($order),
            'message' => __('Order updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Process a refund for an order.
     *
     * @since 1.0.0
     *
     * @param RefundCreateRequest $request
     * @param CreateRefundAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The order with the refund applied.
     */
    public function create_refund(RefundCreateRequest $request, CreateRefundAction $action)
    {
        $dto = CreateRefundPayloadDTO::from_request($request);
        $dto->created_by = user()->get_id() ?? null;

        $updated_order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund processed', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an existing refund of an order.
     *
     * @since 1.0.0
     *
     * @param RefundUpdateRequest $request
     * @param UpdateRefundAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The order with the refund changes applied.
     */
    public function update_refund(RefundUpdateRequest $request, UpdateRefundAction $action)
    {
        $dto = UpdateRefundPayloadDTO::from_request($request);
        $dto->updated_by = user()->get_id() ?? null;

        $updated_order = $action->execute($dto);

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a refund from an order.
     *
     * @since 1.0.0
     *
     * @param Request            $request
     * @param DeleteRefundAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The order after the refund was removed.
     */
    public function delete_refund(Request $request, DeleteRefundAction $action)
    {
        $updated_order = $action->execute($request->int('order_id'), $request->int('id'));

        return response()->json([
            'data' => OrderResource::make($updated_order),
            'message' => __('Refund deleted', 'kirki-ecommerce'),
        ]);
    }
}
