<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * A line of an order payload, as the calculation context service reads it.
 *
 * A line already on the order has an `id`, the ID of the order item. A new line has no `id` and has a `variant_id`.
 *
 * @since 1.0.0
 */
class OrderCalculationLineDTO extends DTO
{
    /** @var int|null ID of the order item, for a line already on the order being edited */
    public $id;

    /** @var int|null Variant of a new line */
    public $variant_id;

    /** @var int */
    public $quantity;
}
