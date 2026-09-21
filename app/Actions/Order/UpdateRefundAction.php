<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Updates a refund on an order and syncs the order once refunds complete.
 *
 * @since 1.0.0
 */
class UpdateRefundAction
{
    /** @var OrderService */
    protected $order_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param OrderService $order_service Order lookup and update service.
     */
    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    // @todo: need to fix this
    /**
     * Update a refund from the payload and sync the order's refund state.
     *
     * Fails with a not-found error when the order has no refund with the given ID.
     *
     * @since 1.0.0
     *
     * @param UpdateRefundPayloadDTO $dto Order ID, refund ID and the fields to update.
     * @return \Kirki\Ecommerce\App\Models\Order The order reloaded with its refunds, items and coupons.
     * @throws Throwable When the update or the order sync fails; the transaction is rolled back.
     */
    public function execute(UpdateRefundPayloadDTO $dto)
    {
        $order = $this->order_service->find_order_or_fail($dto->order_id);
        $refund = $order->refunds->filter(fn($refund) => (int) $refund->id === (int) $dto->id)->values()->first();

        throw_if(!$refund, __('Refund not found.', 'kirki-ecommerce'), NotFoundException::class);

        DB::begin_transaction();

        try {
            if ($dto->status === RefundStatus::COMPLETED && $refund->status !== RefundStatus::COMPLETED) {
                $refund->created_at = Date::now();
            }

            // @todo should we update it this way or should we use repository?
            $refund->update($dto->to_array());

            $this->sync_fulfillment_status($order, $refund, $dto->status);

            DB::commit();

            return $order->fresh('refunds', 'items', 'order_coupons.order_item_coupons');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    // @todo: need to recheck the logic
    /**
     * Mark the order as refunded once completed refunds cover the whole refundable total.
     *
     * Does nothing for pending or cancelled refunds, and partial refunds are not acted on yet.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\Order  $order         Order with its refunds loaded.
     * @param \Kirki\Ecommerce\App\Models\Refund $refund        The refund that was updated.
     * @param string                             $refund_status New status of the refund.
     * @return void
     */
    protected function sync_fulfillment_status($order, $refund, $refund_status)
    {
        if ($refund_status === RefundStatus::PENDING) {
            return;
        }

        if ($refund_status === RefundStatus::CANCELLED) {
            // @todo: should we update it this way or take decision on what to do
            return;
        }

        if ($refund_status === RefundStatus::COMPLETED) {
            $total_refunded = $order->refunds
                ->filter(fn($refund) => $refund->status === RefundStatus::COMPLETED)
                ->sum(fn($refund) => $refund->invoiced_amount);
            $total_refundable = $order->invoiced_total - $order->invoiced_shipping_total - $order->invoiced_payment_provider_fee;
            $is_fully_refunded = $total_refunded >= $total_refundable;

            if ($is_fully_refunded) {
                $this->order_service->mark_refund_as_completed($order->id);
                OrderActivity::refunded($order->fresh(), $refund);
            }

            if (!$is_fully_refunded && $total_refunded > 0 && $order->order_status !== OrderStatus::REFUNDED) {
                // TODO: need to implement or take a decision regarding partial refund

                // $this->order_service->update_order_status($order->id, OrderStatus::PARTIALLY_REFUNDED);
                // $this->order_service->update_payment_status($order->id, PaymentStatus::PARTIALLY_REFUNDED);
            }
        }
    }
}
