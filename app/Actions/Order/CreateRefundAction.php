<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundType;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

class CreateRefundAction
{
    protected $order_service;
    protected $inventory_service;

    public function __construct(
        OrderService $order_service,
        InventoryService $inventory_service
    ) {
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
    }

    // @todo: need to fix this
    public function execute(CreateRefundPayloadDTO $dto)
    {
        $order = $this->order_service->find_order_or_fail($dto->order_id);

        if ($order->payment_status !== PaymentStatus::PAID || !in_array($order->fulfillment_status, [FulfillmentStatus::DELIVERED, FulfillmentStatus::CANCELLED], true)) {
            throw new ValidationException(__('Invalid order status for refund.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        $refundable_amount = $this->get_refundable_amount($order);

        if ($dto->invoiced_amount > $refundable_amount) {
            throw new ValidationException(__('Refund amount exceeds refundable amount.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        DB::begin_transaction();

        try {
            $payment_gateway = Payment::get_gateway($order->payment_gateway);

            // @todo should we create it this way or should we use repository?
            $refund = $order->refunds()->create([
                'invoiced_amount' => $dto->invoiced_amount,
                'reason' => $dto->reason,
                'refund_type' => $dto->invoiced_amount === $refundable_amount ? RefundType::FULL : RefundType::PARTIAL,
                'created_at' => Date::now(),
                'created_by' => $dto->created_by,
            ]);

            if ($payment_gateway) {
                $payment_gateway->refund($order, $refund);
            }

            // Sync Inventory if full refund
            // @todo: Should we release all reserved stock if full refund?

            // @todo: need to decide what to do with order_status, fulfillment_status and payment_status
            $this->order_service->partial_update_order($order->id, [
                'is_refund_initiated' => true,
                'order_status' => OrderStatus::REFUND_REQUESTED
            ]);

            DB::commit();

            return $order->fresh('refunds', 'items');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    protected function get_refundable_amount(Order $order)
    {
        $total_refund_requested = $order->refunds
            ->filter(fn($refund) => in_array($refund->status, [RefundStatus::PENDING, RefundStatus::COMPLETED]))
            ->sum(fn($refund) => $refund->invoiced_amount);

        return $order->invoiced_total - $total_refund_requested - $order->invoiced_shipping_total;
    }
}
