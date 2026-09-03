<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemCouponDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Exception;

use function Kirki\Ecommerce\Framework\collection;

/**
 * Keeps an order's coupon-attribution tables (`order_coupons`/`order_item_coupons`)
 * reconciled with its latest calculation. Used by both order creation and order
 * editing, since both recalculate an order's items/discounts and both need the
 * attribution tables to reflect the result exactly.
 *
 * Expects the using class to provide:
 * - a `convert_amount($amount, $target_currency_code, $exchange_rate)` method,
 *   matching the one already on `CreateOrderAction`/`UpdateOrderAction`.
 * - an `$order_service` property (OrderService), which owns all persistence
 *   for order_coupons/order_item_coupons, matching how order_items are only
 *   ever touched through OrderService.
 */
trait PersistsOrderCoupons
{
    /**
     * Replace an order's coupon-attribution rows with a fresh set built from
     * the given calculation result.
     *
     * @param Order $order
     * @param CalculationResultDTO $calculated_result
     * @param string $currency_code
     * @param float $exchange_rate
     * @return OrderCoupon[]
     */
    protected function sync_order_coupons(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $this->order_service->delete_order_coupons($order->id);

        $order_items_by_variant_id = [];

        foreach ($order->items as $item) {
            $order_items_by_variant_id[$item->variant_id] = $item;
        }

        $order_coupons = [];

        foreach ($calculated_result->coupon_results as $coupon_result) {
            $coupon = $coupon_result->coupon;

            $order_coupon_dto = new CreateOrderCouponDTO();
            $order_coupon_dto->order_id = $order->id;
            $order_coupon_dto->coupon_id = $coupon->id;
            $order_coupon_dto->customer_id = $order->customer_id;
            $order_coupon_dto->code = $coupon->code;
            $order_coupon_dto->title = $coupon->title;
            $order_coupon_dto->discount_type = $coupon->discount_type;
            $order_coupon_dto->discount_target = $coupon->discount_target;
            $order_coupon_dto->coupon_snapshot = $coupon->to_array();
            $order_coupon_dto->invoiced_discount_amount = $this->convert_amount($coupon_result->total_discount, $currency_code, $exchange_rate);
            $order_coupon_dto->base_discount_amount = $coupon_result->total_discount;

            $order_coupon = $this->order_service->create_order_coupon($order_coupon_dto);

            foreach ($coupon_result->item_discounts as $variant_id => $amount) {
                if (empty($amount) || empty($order_items_by_variant_id[$variant_id])) {
                    continue;
                }

                $item_coupon_dto = new CreateOrderItemCouponDTO();
                $item_coupon_dto->order_item_id = $order_items_by_variant_id[$variant_id]->id;
                $item_coupon_dto->order_coupon_id = $order_coupon->id;
                $item_coupon_dto->invoiced_discount_amount = $this->convert_amount($amount, $currency_code, $exchange_rate);
                $item_coupon_dto->base_discount_amount = $amount;

                $this->order_service->create_order_item_coupon($item_coupon_dto);
            }

            $order_coupons[] = $order_coupon;
        }

        $this->assert_order_coupons_reconcile($order_coupons, $calculated_result->base_discount_total);

        return $order_coupons;
    }

    /**
     * @param OrderCoupon[] $order_coupons
     * @param int $expected_total
     * @throws Exception
     */
    protected function assert_order_coupons_reconcile(array $order_coupons, int $expected_total)
    {
        $sum = collection($order_coupons)->sum(fn(OrderCoupon $order_coupon) => $order_coupon->base_discount_amount);

        if ($sum !== $expected_total) {
            throw new Exception(sprintf(
                'Order coupon discount reconciliation failed: order_coupons sum to %d but the order\'s discount total is %d.',
                $sum,
                $expected_total
            ));
        }
    }
}
