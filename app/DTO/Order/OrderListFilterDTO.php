<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class OrderListFilterDTO extends ListFilterDTO
{
    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $start_date;

    /** @var string|null */
    public $end_date;

    /** @var string|null */
    public $status;
}
