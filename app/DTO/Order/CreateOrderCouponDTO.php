<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

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
}
