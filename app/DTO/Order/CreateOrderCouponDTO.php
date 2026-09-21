<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for recording a coupon applied to an order.
 *
 * @since 1.0.0
 */
class CreateOrderCouponDTO extends DTO
{
    /** @var int */
    public $order_id;

    /** @var int */
    public $coupon_id;

    /** @var int|null */
    public $customer_id;

    /** @var string */
    public $code;

    /** @var string */
    public $title;

    /** @var string */
    public $discount_type;

    /** @var string|null */
    public $discount_target;

    /** @var array JSON snapshot of the coupon's rules at checkout */
    public $coupon_snapshot = [];

    /** @var int */
    public $invoiced_discount_amount;

    /** @var int */
    public $base_discount_amount;

    /** @var string|null */
    public $usage_reversed_at;
}
