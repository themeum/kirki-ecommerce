<?php

namespace Kirki\Ecommerce\App\Constants\Order;

defined('ABSPATH') || exit;

/**
 * Changes since an order was last saved that affect its calculation, reported by an edit preview.
 *
 * @since 1.0.0
 */
final class OrderChangeState
{
    const ITEM_DELETED = 'item_deleted';
    const PRICE_CHANGED = 'price_changed';
    const COUPON_REMOVED = 'coupon_removed';
    const COUPON_CHANGED = 'coupon_changed';
    const SHIPPING_METHOD_REMOVED = 'shipping_method_removed';
    const SHIPPING_COST_CHANGED = 'shipping_cost_changed';
    const TAX_MODE_CHANGED = 'tax_mode_changed';
}
