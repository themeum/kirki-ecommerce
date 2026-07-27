<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundType;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Exceptions\ValidationException;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Supports\Facades\Date;
use Kirki\Ecommerce\Supports\Facades\DB;
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

    public function execute(CreateRefundPayloadDTO $dto)
    {
        $order = $this->order_service->find_order_or_fail($dto->order_id);

        $refundable_amount = $this->get_refundable_amount($order);

        if ($dto->amount > $refundable_amount) {
            throw new ValidationException(__('Refund amount exceeds refundable amount.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        DB::begin_transaction();

        try {
            $payment_gateway = Payment::get_gateway($order->payment_gateway);

            // @todo should we create it this way or should we use repository?
            $refund = $order->refunds()->create([
                'amount' => $dto->amount,
                'reason' => $dto->reason,
                'refund_type' => $dto->amount === $refundable_amount ? RefundType::FULL : RefundType::PARTIAL,
                'created_at' => Date::now(),
                'created_by' => $dto->created_by,
            ]);

            if ($payment_gateway) {
                $payment_gateway->refund($order, $refund);
            }

            // Sync Inventory if full refund
            // @todo: Should we release all reserved stock if full refund?

            // @todo should we put the order on hold on refund request pending?
            if (in_array($order->status, [OrderStatus::PROCESSING, OrderStatus::PENDING])) {
                $this->order_service->update_order_status($order->id, OrderStatus::ON_HOLD);
            }

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
            ->sum(fn($refund) => $refund->amount);

        return $order->total - $total_refund_requested - $order->shipping_total;
    }
}
