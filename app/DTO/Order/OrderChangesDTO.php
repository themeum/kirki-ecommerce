<?php

namespace Kirki\Ecommerce\App\DTO\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * What changed since an order was last saved, as OrderChangeState keys for the order, its lines and its coupons.
 *
 * Empty for a new order.
 *
 * @since 1.0.0
 */
class OrderChangesDTO extends DTO
{
    /** @var string[] Keys for the order itself */
    public $order_state = [];

    /** @var array<int, string[]> Keys for each stored line, keyed by order item ID */
    public $item_states = [];

    /** @var array<string, string[]> Keys for each coupon, keyed by coupon code */
    public $coupon_states = [];

    /** @var \Kirki\Ecommerce\App\Models\OrderItem[] Stored lines whose variant was deleted */
    public $deleted_items = [];

    /** @var \Kirki\Ecommerce\App\Models\OrderCoupon[] Stored coupons the calculation no longer applies */
    public $removed_coupons = [];
}
