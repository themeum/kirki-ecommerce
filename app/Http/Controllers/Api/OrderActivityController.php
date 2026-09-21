<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderActivityCreateRequest;
use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for the activity log and comments of an order.
 *
 * @since 1.0.0
 */
class OrderActivityController
{
    /** @var OrderService */
    protected $order_service;
    /** @var OrderActivityService */
    protected $order_activity_service;

    /**
     * Create the controller with the order and order activity services.
     *
     * @since 1.0.0
     *
     * @param OrderService         $order_service
     * @param OrderActivityService $order_activity_service
     */
    public function __construct(OrderService $order_service, OrderActivityService $order_activity_service)
    {
        $this->order_service = $order_service;
        $this->order_activity_service = $order_activity_service;
    }

    /**
     * List the activities of an order, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every activity is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated activities with a success message.
     */
    public function get(Request $request)
    {
        $order_id = $request->int('order_id');

        $this->order_service->find_order_or_fail($order_id);

        $params = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->order_activity_service->all_for_order($order_id);

            return response()->json([
                'data' => OrderActivityResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Activities retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->order_activity_service->paginated_for_order($order_id, $params);

        return response()->json([
            'data' => OrderActivityResource::paginated($data),
            'message' => __('Activities retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Add a comment to an order on behalf of the current user.
     *
     * @since 1.0.0
     *
     * @param OrderActivityCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created activity with a 201 status.
     */
    public function store(OrderActivityCreateRequest $request)
    {
        $order_id = $request->int('order_id');

        $this->order_service->find_order_or_fail($order_id);

        $activity = OrderActivity::comment($order_id, $request->string('message'), user()->get_id() ?: null);

        return response()->json([
            'data' => OrderActivityResource::make($activity),
            'message' => __('Comment added', 'kirki-ecommerce'),
        ], 201);
    }

    /**
     * Delete a comment from an order.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the deletion result.
     */
    public function delete(Request $request)
    {
        $result = $this->order_activity_service->delete_comment($request->int('order_id'), $request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Comment deleted', 'kirki-ecommerce'),
        ]);
    }
}
