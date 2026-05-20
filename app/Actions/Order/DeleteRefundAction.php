<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Exceptions\NotFoundException;

class DeleteRefundAction
{
    protected $order_service;

    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    public function execute(int $order_id, int $id)
    {
        $order = $this->order_service->find_order_or_fail($order_id);
        $refund = $order->refunds->filter(fn($refund) => (int) $refund->id === (int) $id)->values()->first();

        if (!$refund) {
            throw new NotFoundException(__('Refund not found.', 'kirki-ecommerce'));
        }

        // @todo should we allow delete refund? what if its completed?

        $refund->delete();

        return $order->fresh('refunds', 'items');
    }
}
