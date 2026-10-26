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
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * REST controller that calculates order totals for a new order, or for an edit of an existing one, without saving.
 *
 * @since 1.0.0
 */
class OrderCalculationController
{
    /** @var OrderCalculationContextService */
    protected $context_service;

    /** @var OrderService */
    protected $order_service;

    /**
     * Create the controller with the context builder and the order service.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationContextService $context_service Builds the calculation input from the payload.
     * @param OrderService                   $order_service   Order lookup.
     */
    public function __construct(OrderCalculationContextService $context_service, OrderService $order_service)
    {
        $this->context_service = $context_service;
        $this->order_service = $order_service;
    }

    /**
     * Calculate subtotal, discounts, tax, shipping and grand total for the submitted order details.
     *
     * With an `order_id`, the payload is an edit of that order: it is priced with the
     * terms the order was placed with, the same as when the edit is saved.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationRequest $request
     * @param RecalculateCartAction   $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The calculation result, in the store's base currency.
     * @throws NotFoundException When the order to edit does not exist.
     * @throws ValidationException When the order to edit can no longer be edited.
     */
    public function get(OrderCalculationRequest $request, RecalculateCartAction $action)
    {
        $order = $this->find_editable_order($request->input('order_id'));
        $context = $this->context_service->build(OrderCalculationInputDTO::from_payload($request->all()), $order);
        $result = $action->execute($context);

        return response()->json([
            'data' => OrderCalculationResource::make([
                'result' => $result,
                'context' => $context,
                'variants' => $this->context_service->get_variants_map(),
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
        if (empty($order_id)) {
            return null;
        }

        $order = $this->order_service->find_order($order_id);

        throw_if(!$order, __('Order not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
        throw_if(!$order->is_editable(), __('This order can no longer be edited.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        return $order;
    }
}
