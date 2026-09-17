<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

class CreateOrderItemCouponDTO extends DTO
{
    /** @var int */
    public $order_item_id;

    /** @var int */
    public $order_coupon_id;

    /** @var int */
    public $invoiced_discount_amount;

    /** @var int */
    public $base_discount_amount;
}
