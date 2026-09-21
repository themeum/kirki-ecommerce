<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemCouponDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Exception;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Keeps an order's coupon-attribution tables reconciled with its latest calculation.
 *
 * Used by both order creation and order editing, since both recalculate an
 * order's items/discounts and both need the attribution tables
 * (`order_coupons`/`order_item_coupons`) to reflect the result exactly.
 *
 * Expects the using class to provide:
 * - a `convert_amount($amount, $target_currency_code, $exchange_rate)` method,
 *   matching the one already on `CreateOrderAction`/`UpdateOrderAction`.
 * - an `$order_service` property (OrderService), which owns all persistence
 *   for order_coupons/order_item_coupons, matching how order_items are only
 *   ever touched through OrderService.
 * - a `$coupon_service` property (CouponService), for adjusting
 *   `coupons.current_usage_count` as coupons are added to or removed from
 *   an order by this sync.
 *
 * @since 1.0.0
 */
trait PersistsOrderCoupons
{
    /**
     * Replace an order's coupon-attribution rows with a fresh set built from
     * the given calculation result, keeping `coupons.current_usage_count` and
     * each row's `usage_reversed_at` consistent with what actually changed:
     * a coupon present before and after this sync keeps its prior usage
     * state untouched, a newly-applied coupon increments usage (or, if the
     * order is currently cancelled, is recorded as already-reversed so it
     * never counted), and a coupon that's no longer applied decrements
     * usage unless it was already reversed.
     *
     * @since 1.0.0
     *
     * @param Order                $order             Order whose coupon rows are rebuilt.
     * @param CalculationResultDTO $calculated_result Latest calculation for the order.
     * @param string               $currency_code     Order's transaction currency code.
     * @param float                $exchange_rate     Rate from the base currency to the transaction currency.
     * @return OrderCoupon[] The newly created order coupons.
     * @throws Exception When a discounted variant has no matching order item, or the rows do not reconcile with the calculation.
     */
    protected function sync_order_coupons(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $existing_order_coupons_by_coupon_id = [];

        foreach ($order->order_coupons as $existing_order_coupon) {
            $existing_order_coupons_by_coupon_id[$existing_order_coupon->coupon_id] = $existing_order_coupon;
        }

        $this->order_service->delete_order_coupons($order->id);

        $order_items_by_variant_id = [];

        foreach ($order->items as $item) {
            $order_items_by_variant_id[$item->variant_id] = $item;
        }

        $order_coupons = [];
        $synced_coupon_ids = [];

        foreach ($calculated_result->coupon_results as $coupon_result) {
            $coupon = $coupon_result->coupon;
            $synced_coupon_ids[] = $coupon->id;
            $existing_order_coupon = $existing_order_coupons_by_coupon_id[$coupon->id] ?? null;

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

            if ($existing_order_coupon) {
                $order_coupon_dto->usage_reversed_at = $existing_order_coupon->usage_reversed_at;
            } elseif (!empty($order->cancelled_at)) {
                $order_coupon_dto->usage_reversed_at = Date::now();
            } else {
                $this->coupon_service->increment($coupon->id, 'current_usage_count');
            }

            $order_coupon = $this->order_service->create_order_coupon($order_coupon_dto);

            foreach ($coupon_result->item_discounts as $variant_id => $amount) {
                if (empty($amount)) {
                    continue;
                }

                throw_if(
                    empty($order_items_by_variant_id[$variant_id]),
                    sprintf(
                        /* translators: %s: variant ID */
                        __('Order coupon attribution failed: no order item found for variant %s.', 'kirki-ecommerce'),
                        $variant_id
                    )
                );

                $item_coupon_dto = new CreateOrderItemCouponDTO();
                $item_coupon_dto->order_item_id = $order_items_by_variant_id[$variant_id]->id;
                $item_coupon_dto->order_coupon_id = $order_coupon->id;
                $item_coupon_dto->invoiced_discount_amount = $this->convert_amount($amount, $currency_code, $exchange_rate);
                $item_coupon_dto->base_discount_amount = $amount;

                $this->order_service->create_order_item_coupon($item_coupon_dto);
            }

            $order_coupons[] = $order_coupon;
        }

        foreach ($existing_order_coupons_by_coupon_id as $coupon_id => $existing_order_coupon) {
            if (in_array($coupon_id, $synced_coupon_ids, true) || !empty($existing_order_coupon->usage_reversed_at)) {
                continue;
            }

            $this->coupon_service->decrement($coupon_id, 'current_usage_count');
        }

        $this->assert_order_coupons_reconcile(
            $order_coupons,
            $calculated_result->base_discount_total,
            $this->convert_amount($calculated_result->base_discount_total, $currency_code, $exchange_rate)
        );

        return $order_coupons;
    }

    /**
     * Assert the persisted order coupons add up to the calculated discount totals.
     *
     * The base-currency sum is checked for exact equality: `base_discount_amount`
     * is never independently rounded (it's the discount engine's own minor-unit
     * total, copied as-is), so it must match exactly.
     *
     * The invoiced-currency sum allows a small tolerance instead: each
     * order-coupon's `invoiced_discount_amount` is converted independently via
     * `convert_amount()`, so summing several already-rounded per-coupon amounts
     * can legitimately land a few minor units away from converting the
     * pre-summed base total in one shot - that's expected rounding behavior,
     * not a lost/invented cent. A tolerance of one minor unit per order-coupon
     * still catches a genuinely wrong or missing invoiced amount (which is off
     * by far more than that) without failing on ordinary rounding.
     *
     * @since 1.0.0
     *
     * @param OrderCoupon[] $order_coupons           Order coupons just persisted.
     * @param int           $expected_base_total     Calculated discount total in minor units of the base currency.
     * @param int           $expected_invoiced_total Calculated discount total in minor units of the order currency.
     * @return void
     * @throws Exception When either sum does not match its expected total.
     */
    protected function assert_order_coupons_reconcile(array $order_coupons, int $expected_base_total, int $expected_invoiced_total)
    {
        $base_sum = collection($order_coupons)->sum(fn(OrderCoupon $order_coupon) => $order_coupon->base_discount_amount);

        throw_if(
            $base_sum !== $expected_base_total,
            sprintf(
                /* translators: 1: Sum of order coupons, 2: Expected discount total. */
                __('Order coupon discount reconciliation failed: order_coupons sum to %1$d but the order\'s discount total is %2$d.', 'kirki-ecommerce'),
                $base_sum,
                $expected_base_total
            )
        );

        $invoiced_sum = collection($order_coupons)->sum(fn(OrderCoupon $order_coupon) => $order_coupon->invoiced_discount_amount);
        $invoiced_tolerance = count($order_coupons);

        throw_if(
            abs($invoiced_sum - $expected_invoiced_total) > $invoiced_tolerance,
            sprintf(
                /* translators: 1: Invoiced sum of order coupons, 2: Expected invoiced discount total. */
                __('Order coupon discount reconciliation failed: order_coupons invoiced sum to %1$d but the order\'s invoiced discount total is %2$d.', 'kirki-ecommerce'),
                $invoiced_sum,
                $expected_invoiced_total
            )
        );
    }
}
