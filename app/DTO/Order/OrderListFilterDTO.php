<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class OrderListFilterDTO extends ListFilterDTO
{
    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $status;

    /** @var string|null */
    public $fulfillment_status;

    /** @var string|null */
    public $payment_status;
}
