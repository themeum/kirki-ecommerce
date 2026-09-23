<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing orders, adding customer and status filters to the shared list filters.
 *
 * @since 1.0.0
 */
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

    /** @var string|null */
    public $shipping_method;
}
