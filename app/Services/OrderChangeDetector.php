<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\OrderChangeState;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Order\OrderChangesDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Tax;

/**
 * Compares an edit's calculation with the order as last saved and reports
 * what changed that affects the calculation: deleted lines and changed
 * prices, removed and changed coupons, and shipping and tax-mode changes.
 *
 * @since 1.0.0
 */
class OrderChangeDetector
{
    /**
     * Coupon fields that decide how much a valid coupon discounts, with the type each is compared as.
     *
     * Fields that only decide whether a coupon applies (dates, limits, spend
     * conditions, countries, customers) are left out: a coupon that stops
     * applying is reported as removed instead.
     */
    const COUPON_RULE_TYPES = [
        'discount_type' => 'string',
        'discount_target' => 'string',
        'discount_value_type' => 'string',
        'base_discount_amount_fixed' => 'int',
        'discount_amount_percentage' => 'float',
        'eligible_item_type' => 'string',
        'reward_quantity' => 'int',
        'reward_value' => 'int',
    ];

    /** @var ShippingService */
    protected $shipping_service;

    /**
     * Create the detector with the shipping service.
     *
     * @since 1.0.0
     *
     * @param ShippingService $shipping_service Tells whether the selected shipping method is available.
     */
    public function __construct(ShippingService $shipping_service)
    {
        $this->shipping_service = $shipping_service;
    }

    /**
     * Detect what changed since the order was last saved.
     *
     * @since 1.0.0
     *
     * @param Order                 $order   Order as last saved, with its items and order coupons.
     * @param CalculationContextDTO $context Calculation input of the edit.
     * @param CalculationResultDTO  $result  Calculation result of the edit.
     * @return OrderChangesDTO
     */
    public function detect(Order $order, CalculationContextDTO $context, CalculationResultDTO $result)
    {
        $changes = new OrderChangesDTO();

        $this->detect_item_states($changes, $order, $context);
        $this->detect_coupon_states($changes, $order, $result);
        $this->detect_order_state($changes, $order, $context, $result);

        return $changes;
    }

    /**
     * Report each stored line whose variant was deleted, and each kept line whose catalog price changed.
     *
     * Prices are compared on the catalog basis: the sale price (or the regular
     * price when there is no sale) and the regular price. A new line has nothing to compare with.
     *
     * @since 1.0.0
     *
     * @param OrderChangesDTO       $changes Changes to fill.
     * @param Order                 $order   Order as last saved.
     * @param CalculationContextDTO $context Calculation input of the edit.
     * @return void
     */
    protected function detect_item_states(OrderChangesDTO $changes, Order $order, CalculationContextDTO $context)
    {
        $stored_items_by_variant_id = [];

        foreach ($order->items as $stored_item) {
            if (empty($stored_item->variant_id)) {
                $changes->item_states[$stored_item->id] = [OrderChangeState::ITEM_DELETED];
                $changes->deleted_items[] = $stored_item;
                continue;
            }

            $stored_items_by_variant_id[$stored_item->variant_id] = $stored_item;
        }

        foreach ($context->items as $item) {
            $stored_item = $stored_items_by_variant_id[$item->variant_id] ?? null;

            if (!$stored_item) {
                continue;
            }

            if ((int) $item->base_unit_price !== (int) $stored_item->base_catalog_sale_price || (int) $item->base_product_total !== (int) $stored_item->base_catalog_regular_price) {
                $changes->item_states[$stored_item->id] = [OrderChangeState::PRICE_CHANGED];
            }
        }
    }

    /**
     * Report each stored coupon the edit no longer applies, and each kept coupon whose discount rules changed.
     *
     * A code sent with the edit that was not on the order is not reported.
     *
     * @since 1.0.0
     *
     * @param OrderChangesDTO      $changes Changes to fill.
     * @param Order                $order   Order as last saved.
     * @param CalculationResultDTO $result  Calculation result of the edit.
     * @return void
     */
    protected function detect_coupon_states(OrderChangesDTO $changes, Order $order, CalculationResultDTO $result)
    {
        $applied_coupons_by_code = [];

        foreach ($result->coupon_results as $coupon_result) {
            $applied_coupons_by_code[strtolower($coupon_result->coupon->code)] = $coupon_result->coupon;
        }

        foreach ($order->order_coupons as $order_coupon) {
            $applied_coupon = $applied_coupons_by_code[strtolower($order_coupon->code)] ?? null;

            if (!$applied_coupon) {
                $changes->coupon_states[$order_coupon->code] = [OrderChangeState::COUPON_REMOVED];
                $changes->removed_coupons[] = $order_coupon;
                continue;
            }

            if ($this->has_coupon_rules_changed($order_coupon->coupon_snapshot ?: [], $applied_coupon->to_array())) {
                $changes->coupon_states[$applied_coupon->code] = [OrderChangeState::COUPON_CHANGED];
            }
        }
    }

    /**
     * Report shipping and tax-mode changes for the order itself.
     *
     * A removed shipping method is reported only while the edit still uses the
     * stored method, and then the cost is not compared. Otherwise a different
     * shipping total is reported.
     *
     * @since 1.0.0
     *
     * @param OrderChangesDTO       $changes Changes to fill.
     * @param Order                 $order   Order as last saved.
     * @param CalculationContextDTO $context Calculation input of the edit.
     * @param CalculationResultDTO  $result  Calculation result of the edit.
     * @return void
     */
    protected function detect_order_state(OrderChangesDTO $changes, Order $order, CalculationContextDTO $context, CalculationResultDTO $result)
    {
        $uses_stored_method = !empty($context->shipping_method_id) && (string) $context->shipping_method_id === (string) $order->shipping_method;

        if ($uses_stored_method && !$this->shipping_service->get_selected_shipping_method($context)) {
            $changes->order_state[] = OrderChangeState::SHIPPING_METHOD_REMOVED;
        } elseif ((int) $result->base_shipping_total !== (int) $order->base_shipping_total) {
            $changes->order_state[] = OrderChangeState::SHIPPING_COST_CHANGED;
        }

        if ($this->is_tax_inclusive() !== (bool) $order->is_tax_inclusive) {
            $changes->order_state[] = OrderChangeState::TAX_MODE_CHANGED;
        }
    }

    /**
     * Tell whether a coupon's discount rules differ from the snapshot stored on the order.
     *
     * A field missing from the snapshot is not compared, so an empty snapshot never reports a change.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $snapshot Coupon as stored on the order.
     * @param array<string, mixed> $current  Coupon as it is now, with its products and categories.
     * @return bool
     */
    protected function has_coupon_rules_changed(array $snapshot, array $current)
    {
        foreach (static::COUPON_RULE_TYPES as $field => $type) {
            if (array_key_exists($field, $snapshot) && $this->cast_rule($snapshot[$field], $type) !== $this->cast_rule($current[$field] ?? null, $type)) {
                return true;
            }
        }

        if (array_key_exists('products', $snapshot) && $this->get_product_targets($snapshot['products']) !== $this->get_product_targets($current['products'] ?? [])) {
            return true;
        }

        return array_key_exists('categories', $snapshot) && $this->get_category_targets($snapshot['categories']) !== $this->get_category_targets($current['categories'] ?? []);
    }

    /**
     * Cast a coupon rule value so stored and current values compare alike.
     *
     * @since 1.0.0
     *
     * @param mixed  $value Rule value.
     * @param string $type  `string`, `int` or `float`.
     * @return string|int|float|null Null stays null.
     */
    protected function cast_rule($value, string $type)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($type === 'int') {
            return (int) $value;
        }

        if ($type === 'float') {
            return (float) $value;
        }

        return (string) $value;
    }

    /**
     * Get a coupon's targeted products as sorted `id:reward-flag` keys.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $products Products as given by the coupon's `to_array()`.
     * @return string[]
     */
    protected function get_product_targets(array $products)
    {
        $targets = array_map(fn($product) => (int) $product['id'] . ':' . (empty($product['pivot']['is_reward_item']) ? 0 : 1), $products);

        sort($targets);

        return $targets;
    }

    /**
     * Get a coupon's targeted category IDs, sorted.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $categories Categories as given by the coupon's `to_array()`.
     * @return int[]
     */
    protected function get_category_targets(array $categories)
    {
        $targets = array_map(fn($category) => (int) $category['id'], $categories);

        sort($targets);

        return $targets;
    }

    /**
     * Tell whether the store prices items inclusive of tax now.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function is_tax_inclusive()
    {
        return Tax::is_tax_inclusive();
    }
}
