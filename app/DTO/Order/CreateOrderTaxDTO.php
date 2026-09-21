<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for recording a tax line on an order or order item.
 *
 * @since 1.0.0
 */
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
