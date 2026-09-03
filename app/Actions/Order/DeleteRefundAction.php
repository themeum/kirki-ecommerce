<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

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
            throw new NotFoundException(__('Refund not found.', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        // @todo should we allow delete refund? what if its completed?

        $refund_snapshot = [
            'id' => $refund->id,
            'invoiced_amount' => $refund->invoiced_amount,
            'currency_code' => $order->currency_code,
        ];

        $refund->delete();

        OrderActivity::refund_deleted($order->fresh('refunds'), $refund_snapshot);

        return $order->fresh('refunds', 'items');
    }
}
