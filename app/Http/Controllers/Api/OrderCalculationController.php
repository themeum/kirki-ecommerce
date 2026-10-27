<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationInputDTO;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCalculationRequest;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;
use Kirki\Ecommerce\App\Services\OrderCalculationContextService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller that calculates order totals for a new order, or for an edit of an existing one, without saving.
 *
 * @since 1.0.0
 */
class OrderCalculationController
{
    /** @var OrderService */
    protected $order_service;

    /**
     * Create the controller with the order service.
     *
     * @since 1.0.0
     *
     * @param OrderService $order_service Order lookup.
     */
    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    /**
     * Calculate subtotal, discounts, tax, shipping and grand total for the submitted order details.
     *
     * With an `order_id`, the payload is an edit of that order: it is priced with the
     * terms the order was placed with, the same as when the edit is saved, and it is refused
     * for the same currency and shipping method faults.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationRequest        $request
     * @param RecalculateCartAction          $action
     * @param OrderCalculationContextService $context_service Builds the calculation input from the payload.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The calculation result, in the store's base currency.
     * @throws NotFoundException When the order to edit does not exist.
     * @throws ValidationException When the order to edit can no longer be edited, its currency would change, or its shipping method is not available.
     */
    public function get(OrderCalculationRequest $request, RecalculateCartAction $action, OrderCalculationContextService $context_service)
    {
        $order = $this->find_editable_order($request->input('order_id'));
        $input = OrderCalculationInputDTO::from_payload($request->all());
        $context = $context_service->build($input, $order);

        if ($order) {
            $context_service->validate_edit($order, $input, $context);
        }

        $result = $action->execute($context);

        return response()->json([
            'data' => OrderCalculationResource::make([
                'result' => $result,
                'context' => $context,
                'variants' => $context_service->get_variants_map(),
            ])
        ]);
    }

    /**
     * Find the order an edit preview is for.
     *
     * @since 1.0.0
     *
     * @param int|null $order_id Order ID from the payload.
     * @return \Kirki\Ecommerce\App\Models\Order|null Null when no order ID was sent.
     * @throws NotFoundException When the order does not exist.
     * @throws ValidationException When the order can no longer be edited.
     */
    protected function find_editable_order($order_id)
    {
        return empty($order_id) ? null : $this->order_service->find_editable_order_or_fail($order_id);
    }
}
