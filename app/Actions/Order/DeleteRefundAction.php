<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Deletes a refund record from an order.
 *
 * @since 1.0.0
 */
class DeleteRefundAction
{
    /** @var OrderService */
    protected $order_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param OrderService $order_service Order lookup service.
     */
    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    /**
     * Delete a refund from an order and log the deletion in the order activity.
     *
     * Fails with a not-found error when the order has no refund with the given ID.
     *
     * @since 1.0.0
     *
     * @param int $order_id ID of the order the refund belongs to.
     * @param int $id       Refund ID.
     * @return \Kirki\Ecommerce\App\Models\Order The order reloaded with its refunds, items and coupons.
     * @throws NotFoundException When the order has no refund with the given ID.
     */
    public function execute(int $order_id, int $id)
    {
        $order = $this->order_service->find_order_or_fail($order_id);
        $refund = $order->refunds->filter(fn($refund) => (int) $refund->id === (int) $id)->values()->first();

        throw_if(!$refund, __('Refund not found.', 'kirki-ecommerce'), NotFoundException::class);

        // @todo should we allow delete refund? what if its completed?

        $refund_snapshot = [
            'id' => $refund->id,
            'invoiced_amount' => $refund->invoiced_amount,
            'currency_code' => $order->currency_code,
        ];

        $refund->delete();

        OrderActivity::refund_deleted($order->fresh('refunds'), $refund_snapshot);

        return $order->fresh('refunds', 'items', 'order_coupons.order_item_coupons');
    }
}
