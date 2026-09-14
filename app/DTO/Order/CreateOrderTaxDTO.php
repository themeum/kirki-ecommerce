<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

class CreateOrderTaxDTO extends DTO
{
    /** @var int */
    public $order_id;

    /** @var int|null */
    public $order_item_id;

    /** @var string */
    public $type;

    /** @var string */
    public $name;

    /** @var float */
    public $rate;

    /** @var int */
    public $invoiced_amount;

    /** @var int */
    public $base_amount;
}
