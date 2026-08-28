<?php

/**
 * Customer-facing order activity timeline.
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\response;

/**
 * Class OrderActivityController
 *
 * @since 1.0.0
 */
class OrderActivityController
{
    /**
     * Order activity timeline for the current customer's own order.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service order service.
     * @param OrderActivityService $order_activity_service order activity service.
     *
     * @return Response response.
     * @throws NotFoundException When the order does not exist or is not owned by the requesting customer.
     */
    public function get(Request $request, OrderService $order_service, OrderActivityService $order_activity_service)
    {
        $order_id = $request->int('id');
        $customer_id = customer()->get_customer_id();
        $order = $order_service->find_order($order_id);

        if (!$order || empty($customer_id) || $order->customer_id !== $customer_id) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $params = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $order_activity_service->all_for_order($order_id);

            return response()->json([
                'data' => OrderActivityResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Activities retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $order_activity_service->paginated_for_order($order_id, $params);

        return response()->json([
            'data' => OrderActivityResource::paginated($data),
            'message' => __('Activities retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
