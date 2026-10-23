<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemCouponDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
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
     * a coupon that stays on the order keeps its stored terms and its prior
     * usage state untouched, a newly-applied coupon increments usage (or, if
     * the order is currently cancelled, is recorded as already-reversed so it
     * never counted), and a coupon that's no longer applied decrements usage
     * unless it was already reversed.
     *
     * @since 1.0.0
     *
     * @param Order                        $order                   Order whose coupon rows are rebuilt.
     * @param CalculationResultDTO         $calculated_result       Latest calculation for the order.
     * @param array<int|string, OrderItem> $order_items_by_line_key Saved order items, keyed by the line key they were calculated under.
     * @param string                       $currency_code           Order's transaction currency code.
     * @param float                        $exchange_rate           Rate from the base currency to the transaction currency.
     * @return OrderCoupon[] The newly created order coupons.
     * @throws Exception When a discounted line has no matching order item, or the rows do not reconcile with the calculation.
     */
    protected function sync_order_coupons(Order $order, CalculationResultDTO $calculated_result, array $order_items_by_line_key, string $currency_code, float $exchange_rate)
    {
        $previous_order_coupons = $order->order_coupons;

        $this->order_service->delete_order_coupons($order->id);

        $order_coupons = [];
        $kept_order_coupon_ids = [];

        foreach ($calculated_result->coupon_results as $coupon_result) {
            $kept_order_coupon = $coupon_result->order_coupon;

            $order_coupon_dto = $kept_order_coupon
                ? $this->prepare_kept_order_coupon_dto($kept_order_coupon)
                : $this->prepare_new_order_coupon_dto($order, $coupon_result->coupon);
            $order_coupon_dto->invoiced_discount_amount = $this->convert_amount($coupon_result->total_discount, $currency_code, $exchange_rate);
            $order_coupon_dto->base_discount_amount = $coupon_result->total_discount;

            if ($coupon_result->coupon->discount_type === DiscountType::AMOUNT_OFF && $coupon_result->coupon->discount_value_type === DiscountValueType::FIXED) {
                $order_coupon_dto->base_max_discount_amount = $kept_order_coupon
                    ? ($kept_order_coupon->base_max_discount_amount ?? $kept_order_coupon->base_discount_amount)
                    : $coupon_result->total_discount;
            }

            $order_coupon = $this->order_service->create_order_coupon($order_coupon_dto);
            $order_coupons[] = $order_coupon;

            if ($kept_order_coupon) {
                $kept_order_coupon_ids[] = $kept_order_coupon->id;
            }

            $this->sync_order_item_coupons($order_coupon, $coupon_result, $order_items_by_line_key, $currency_code, $exchange_rate);
        }

        foreach ($previous_order_coupons as $previous_order_coupon) {
            if (empty($previous_order_coupon->coupon_id) || !empty($previous_order_coupon->usage_reversed_at) || in_array($previous_order_coupon->id, $kept_order_coupon_ids, true)) {
                continue;
            }

            $this->coupon_service->release_usage($previous_order_coupon->coupon_id);
        }

        $this->assert_order_coupons_reconcile(
            $order_coupons,
            $calculated_result->base_discount_total,
            $this->convert_amount($calculated_result->base_discount_total, $currency_code, $exchange_rate)
        );

        return $order_coupons;
    }

    /**
     * Prepare the order coupon of a coupon that stays on the order, with the terms and usage state it already has.
     *
     * @since 1.0.0
     *
     * @param OrderCoupon $kept_order_coupon Order coupon as stored.
     * @return CreateOrderCouponDTO Stored terms; the discount amounts are left for the caller.
     */
    protected function prepare_kept_order_coupon_dto(OrderCoupon $kept_order_coupon)
    {
        $order_coupon_dto = new CreateOrderCouponDTO();
        $order_coupon_dto->order_id = $kept_order_coupon->order_id;
        $order_coupon_dto->coupon_id = $kept_order_coupon->coupon_id;
        $order_coupon_dto->customer_id = $kept_order_coupon->customer_id;
        $order_coupon_dto->code = $kept_order_coupon->code;
        $order_coupon_dto->title = $kept_order_coupon->title;
        $order_coupon_dto->discount_type = $kept_order_coupon->discount_type;
        $order_coupon_dto->discount_target = $kept_order_coupon->discount_target;
        $order_coupon_dto->discount_rate = $kept_order_coupon->discount_rate;
        $order_coupon_dto->base_max_discount_amount = $kept_order_coupon->base_max_discount_amount;
        $order_coupon_dto->coupon_snapshot = $kept_order_coupon->coupon_snapshot ?: [];
        $order_coupon_dto->usage_reversed_at = $kept_order_coupon->usage_reversed_at;

        return $order_coupon_dto;
    }

    /**
     * Prepare the order coupon of a coupon that is new to the order, and count its use.
     *
     * @since 1.0.0
     *
     * @param Order  $order  Order the coupon is applied to.
     * @param Coupon $coupon Coupon as it is now.
     * @return CreateOrderCouponDTO Coupon terms; the discount amounts are left for the caller.
     * @throws ValidationException When the coupon's usage limit is reached.
     */
    protected function prepare_new_order_coupon_dto(Order $order, Coupon $coupon)
    {
        $order_coupon_dto = new CreateOrderCouponDTO();
        $order_coupon_dto->order_id = $order->id;
        $order_coupon_dto->coupon_id = $coupon->id;
        $order_coupon_dto->customer_id = $order->customer_id;
        $order_coupon_dto->code = $coupon->code;
        $order_coupon_dto->title = $coupon->title;
        $order_coupon_dto->discount_type = $coupon->discount_type;
        $order_coupon_dto->discount_target = $coupon->discount_target;
        $order_coupon_dto->discount_rate = $coupon->discount_value_type === DiscountValueType::PERCENTAGE ? $coupon->discount_amount_percentage : null;
        $order_coupon_dto->coupon_snapshot = $coupon->to_array();

        if (!empty($order->cancelled_at)) {
            $order_coupon_dto->usage_reversed_at = Date::now();
        } else {
            $this->claim_coupon_usage($coupon, $order);
        }

        return $order_coupon_dto;
    }

    /**
     * Record the share of a coupon's discount that each line received.
     *
     * @since 1.0.0
     *
     * @param OrderCoupon                  $order_coupon            Order coupon the shares belong to.
     * @param CouponDiscountResultDTO      $coupon_result           Discount the coupon gave.
     * @param array<int|string, OrderItem> $order_items_by_line_key Saved order items, keyed by the line key they were calculated under.
     * @param string                       $currency_code           Order's transaction currency code.
     * @param float                        $exchange_rate           Rate from the base currency to the transaction currency.
     * @return void
     * @throws Exception When a discounted line has no matching order item.
     */
    protected function sync_order_item_coupons(OrderCoupon $order_coupon, CouponDiscountResultDTO $coupon_result, array $order_items_by_line_key, string $currency_code, float $exchange_rate)
    {
        $stored_item_coupons = [];
        $item_discounts = $coupon_result->item_discounts;

        if ($coupon_result->order_coupon) {
            foreach ($coupon_result->order_coupon->order_item_coupons as $stored_item_coupon) {
                $stored_item_coupons[$stored_item_coupon->order_item_id] = $stored_item_coupon;
            }

            foreach ($order_items_by_line_key as $line_key => $order_item) {
                if (isset($stored_item_coupons[$order_item->id]) && !isset($item_discounts[$line_key])) {
                    $item_discounts[$line_key] = 0;
                }
            }
        }

        foreach ($item_discounts as $line_key => $amount) {
            throw_if(
                empty($order_items_by_line_key[$line_key]),
                sprintf(
                    /* translators: %s: line key of the discounted item */
                    __('Order coupon attribution failed: no order item found for line %s.', 'kirki-ecommerce'),
                    $line_key
                )
            );

            $stored_item_coupon = $stored_item_coupons[$order_items_by_line_key[$line_key]->id] ?? null;

            if (empty($amount) && !$stored_item_coupon) {
                continue;
            }

            $item_coupon_dto = new CreateOrderItemCouponDTO();
            $item_coupon_dto->order_item_id = $order_items_by_line_key[$line_key]->id;
            $item_coupon_dto->order_coupon_id = $order_coupon->id;
            $item_coupon_dto->invoiced_discount_amount = $this->convert_amount($amount, $currency_code, $exchange_rate);
            $item_coupon_dto->base_discount_amount = $amount;

            if ($coupon_result->coupon->discount_type === DiscountType::AMOUNT_OFF && $coupon_result->coupon->discount_value_type === DiscountValueType::FIXED) {
                $item_coupon_dto->base_max_discount_amount = $stored_item_coupon
                    ? ($stored_item_coupon->base_max_discount_amount ?? $stored_item_coupon->base_discount_amount)
                    : $amount;
            }

            $this->order_service->create_order_item_coupon($item_coupon_dto);
        }
    }

    /**
     * Count one use of a coupon for an order, failing when the coupon ran out meanwhile.
     *
     * The total limit is enforced by the update itself. That update also locks the
     * coupon row until the transaction ends, so the per-customer limit is checked
     * again afterwards: a competing order from the same buyer is waiting for the
     * lock and cannot slip a use in between.
     *
     * @since 1.0.0
     *
     * @param Coupon $coupon Coupon applied to the order.
     * @param Order  $order  Order the coupon is applied to.
     * @return void
     * @throws ValidationException When the total or per-customer usage limit is reached.
     */
    protected function claim_coupon_usage(Coupon $coupon, Order $order)
    {
        throw_if(!$this->coupon_service->claim_usage($coupon->id), __('Coupon usage limit reached.', 'kirki-ecommerce'), ValidationException::class);

        if (!$coupon->has_customer_limit || $coupon->customer_limit <= 0) {
            return;
        }

        $customer_usage = $this->order_service->count_coupon_usages($coupon->id, $order->customer_id, $order->customer_email, $order->id);

        throw_if($customer_usage >= $coupon->customer_limit, __('You have reached the usage limit for this coupon.', 'kirki-ecommerce'), ValidationException::class);
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
