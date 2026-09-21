<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundType;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Creates a refund request for a paid order and pushes it to the payment gateway.
 *
 * @since 1.0.0
 */
class CreateRefundAction
{
    /** @var OrderService */
    protected $order_service;

    /** @var InventoryService */
    protected $inventory_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param OrderService     $order_service     Order lookup and update service.
     * @param InventoryService $inventory_service Inventory service.
     */
    public function __construct(
        OrderService $order_service,
        InventoryService $inventory_service
    ) {
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
    }

    // @todo: need to fix this
    /**
     * Create a refund for an order and mark the order as refund requested.
     *
     * Only paid orders that are delivered or cancelled can be refunded, and
     * the amount cannot exceed what is still refundable. The refund is sent to
     * the payment gateway when the order carries a gateway transaction.
     *
     * @since 1.0.0
     *
     * @param CreateRefundPayloadDTO $dto Order ID, refund amount, reason and creator.
     * @return Order The order reloaded with its refunds, items and coupons.
     * @throws Throwable When the refund record or the gateway call fails; the transaction is rolled back.
     */
    public function execute(CreateRefundPayloadDTO $dto)
    {
        $order = $this->order_service->find_order_or_fail($dto->order_id);

        throw_if($order->payment_status !== PaymentStatus::PAID || !in_array($order->fulfillment_status, [FulfillmentStatus::DELIVERED, FulfillmentStatus::CANCELLED], true), __('Invalid order status for refund.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $refundable_amount = $this->get_refundable_amount($order);

        throw_if($dto->invoiced_amount > $refundable_amount, __('Refund amount exceeds refundable amount.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        DB::begin_transaction();

        try {
            $provider = Payment::get_provider($order->payment_provider);

            // @todo should we create it this way or should we use repository?
            $refund = $order->refunds()->create([
                'invoiced_amount' => $dto->invoiced_amount,
                'reason' => $dto->reason,
                'refund_type' => $dto->invoiced_amount === $refundable_amount ? RefundType::FULL : RefundType::PARTIAL,
                'created_at' => Date::now(),
                'created_by' => $dto->created_by,
            ]);

            // Only push to the gateway when the order carries a gateway
            // transaction. Manual/admin-created orders were never charged
            // through the provider, so the local refund record is all there is.
            if ($provider && !empty($order->payment_transaction_id)) {
                $provider->refund($order, $refund);
            }

            // Sync Inventory if full refund
            // @todo: Should we release all reserved stock if full refund?

            // @todo: need to decide what to do with order_status, fulfillment_status and payment_status
            $this->order_service->partial_update_order($order->id, [
                'is_refund_initiated' => true,
                'order_status' => OrderStatus::REFUND_REQUESTED
            ]);

            OrderActivity::refund_requested($order->fresh('refunds'), $refund);

            DB::commit();

            return $order->fresh('refunds', 'items', 'order_coupons.order_item_coupons');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Calculate how much of the order can still be refunded.
     *
     * Excludes shipping and amounts already covered by pending or completed refunds.
     *
     * @since 1.0.0
     *
     * @param Order $order Order with its refunds loaded.
     * @return int|float Refundable amount in the order's invoiced currency.
     */
    protected function get_refundable_amount(Order $order)
    {
        $total_refund_requested = $order->refunds
            ->filter(fn($refund) => in_array($refund->status, [RefundStatus::PENDING, RefundStatus::COMPLETED]))
            ->sum(fn($refund) => $refund->invoiced_amount);

        return $order->invoiced_total - $total_refund_requested - $order->invoiced_shipping_total;
    }
}
